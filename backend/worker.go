package main

import (
	"encoding/json"
	"log"
	"time"
)

// StartSweeperWorker sweeps for 2-minute expired seat hold locks periodically
func StartSweeperWorker() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		expiredSeats := SweepExpiredLocks()
		for _, seatID := range expiredSeats {
			log.Printf("⏱️ 2-Minute Lock Expired for Seat %s. Releasing back to available pool.\n", seatID)

			// Broadcast release to all connected WebSockets
			bcast, _ := json.Marshal(WSResponse{
				Action: "broadcast_release",
				Seat:   seatID,
				Status: "available",
			})
			hub.broadcast <- bcast
		}
	}
}
