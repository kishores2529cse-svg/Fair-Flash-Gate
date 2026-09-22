package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
)

var rdb *redis.Client
var ctx = context.Background()
var isRedisAvailable = false

type InMemLock struct {
	UserID    string
	ExpiresAt time.Time
}

var inMemLocks = make(map[string]InMemLock)
var inMemTicketPool int64 = 10000
var lockMu sync.Mutex

// Lua Script for Atomic Ticket Decrement (Guarantees zero overselling)
var atomicDecrementLua = redis.NewScript(`
	local current = tonumber(redis.call('get', KEYS[1]))
	if current == nil or current <= 0 then
		return -1
	end
	return redis.call('decr', KEYS[1])
`)

func InitRedis() {
	rdb = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		fmt.Printf("⚠️ Redis server not found (%v). Running thread-safe in-memory fallback engine.\n", err)
		isRedisAvailable = false
	} else {
		fmt.Println("⚡ Connected to Redis Server on localhost:6379")
		isRedisAvailable = true
		rdb.Set(ctx, "tickets_remaining", 10000, 0)
	}
}

// LockSeat tries to lock a seat with a 2-minute TTL (120 seconds)
func LockSeat(seatID string, userID string) (bool, error) {
	if isRedisAvailable && rdb != nil {
		lockKey := fmt.Sprintf("lock:seat:%s", seatID)
		// SETNX (Set if Not Exists) with 2-minute TTL (120s)
		success, err := rdb.SetNX(ctx, lockKey, userID, 2*time.Minute).Result()
		if err == nil {
			return success, nil
		}
	}

	// Thread-safe In-Memory Fallback Lock Engine
	lockMu.Lock()
	defer lockMu.Unlock()

	currentLock, exists := inMemLocks[seatID]
	if exists {
		// If lock is still valid and unexpired
		if time.Now().Before(currentLock.ExpiresAt) {
			if currentLock.UserID == userID {
				return true, nil // Already locked by this exact user
			}
			return false, nil // Seat conflict! Locked by another user
		}
	}

	// Lock acquired for 2 minutes (120 seconds)
	inMemLocks[seatID] = InMemLock{
		UserID:    userID,
		ExpiresAt: time.Now().Add(2 * time.Minute),
	}
	return true, nil
}

// UnlockSeat releases a seat lock
func UnlockSeat(seatID string) error {
	if isRedisAvailable && rdb != nil {
		lockKey := fmt.Sprintf("lock:seat:%s", seatID)
		rdb.Del(ctx, lockKey)
	}

	lockMu.Lock()
	defer lockMu.Unlock()
	delete(inMemLocks, seatID)
	return nil
}

// DecrementTicketPool executes atomic ticket decrement
func DecrementTicketPool() (int64, error) {
	if isRedisAvailable && rdb != nil {
		res, err := atomicDecrementLua.Run(ctx, rdb, []string{"tickets_remaining"}).Int64()
		if err == nil {
			return res, nil
		}
	}

	lockMu.Lock()
	defer lockMu.Unlock()
	if inMemTicketPool <= 0 {
		return -1, nil
	}
	inMemTicketPool--
	return inMemTicketPool, nil
}

// CheckIdempotency checks if checkout ID was already processed
func CheckIdempotency(checkoutID string) bool {
	if checkoutID == "" {
		return true
	}
	if isRedisAvailable && rdb != nil {
		key := fmt.Sprintf("idempotency:%s", checkoutID)
		success, _ := rdb.SetNX(ctx, key, "processed", 24*time.Hour).Result()
		return success
	}
	return true
}

// SweepExpiredLocks checks for any 2-minute locks that expired and returns their seatIDs
func SweepExpiredLocks() []string {
	lockMu.Lock()
	defer lockMu.Unlock()

	var expiredSeats []string
	now := time.Now()

	for seatID, lockInfo := range inMemLocks {
		if now.After(lockInfo.ExpiresAt) {
			expiredSeats = append(expiredSeats, seatID)
			delete(inMemLocks, seatID)
		}
	}
	return expiredSeats
}
