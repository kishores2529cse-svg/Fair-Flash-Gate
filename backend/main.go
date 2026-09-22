package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev/WS testing
	},
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize Redis
	InitRedis()
	fmt.Println("🚀 Redis Concurrency Engine Initialized")

	// Initialize Ticket Pool (10,000 tickets)
	ctx := context.Background()
	rdb.Set(ctx, "tickets_remaining", 10000, 0)
	fmt.Println("🎟️ Ticket Pool initialized to 10,000 tickets")

	// Start Background Sweeper Goroutine
	go StartSweeperWorker()

	// WebSocket & API Routes
	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/health", handleHealth)
	http.HandleFunc("/join-queue", handleJoinQueue)
	http.HandleFunc("/checkout", handleCheckout)

	log.Printf("🔥 Fair-Flash-Gate Go Engine listening on :%s\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server crashed: %v", err)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"UP","engine":"Fair-Flash-Gate Go Redis"}`))
}
