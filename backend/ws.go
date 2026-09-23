package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	id   string
	conn *websocket.Conn
	send chan []byte
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.Mutex
}

var hub = Hub{
	broadcast:  make(chan []byte),
	register:   make(chan *Client),
	unregister: make(chan *Client),
	clients:    make(map[*Client]bool),
}

func init() {
	go hub.run()
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("New WebSocket client connected (ID: %s)\n", client.id)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("WebSocket client disconnected (ID: %s)\n", client.id)

			// Automatically release any temporary locks held by this disconnected client
			go func(cID string) {
				released := UnlockSeatsByUser(cID)
				for _, seatID := range released {
					bcast, _ := json.Marshal(WSResponse{
						Action: "broadcast_release",
						Seat:   seatID,
						Status: "available",
					})
					h.broadcast <- bcast
				}
			}(client.id)

		case message := <-h.broadcast:
			h.mu.Lock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}

type WSMessage struct {
	Action     string `json:"action"`
	Seat       string `json:"seat,omitempty"`
	UserID     string `json:"user_id,omitempty"`
	CheckoutID string `json:"checkout_id,omitempty"`
}

type WSResponse struct {
	Action      string   `json:"action"`
	Seat        string   `json:"seat,omitempty"`
	Status      string   `json:"status,omitempty"`
	Message     string   `json:"message,omitempty"`
	LockedSeats []string `json:"locked_seats,omitempty"`
	SoldSeats   []string `json:"sold_seats,omitempty"`
	ClientID    string   `json:"client_id,omitempty"`
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}

	clientID := fmt.Sprintf("usr_%d", time.Now().UnixNano())
	client := &Client{id: clientID, conn: conn, send: make(chan []byte, 256)}
	hub.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			break
		}

		var msg WSMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		switch msg.Action {
		case "sync":
			locked, sold := GetSyncState()
			resp, _ := json.Marshal(WSResponse{
				Action:      "sync_response",
				LockedSeats: locked,
				SoldSeats:   sold,
			})
			c.send <- resp

		case "purchase":
			PurchaseSeat(msg.Seat, c.id)
			bcast, _ := json.Marshal(WSResponse{
				Action: "broadcast_sold",
				Seat:   msg.Seat,
				Status: "sold",
			})
			hub.broadcast <- bcast

		case "lock":
			// Lock seat using this client's unique ID
			locked, err := LockSeat(msg.Seat, c.id)
			if err != nil || !locked {
				// Race condition lost / Seat already locked by another user!
				resp, _ := json.Marshal(WSResponse{
					Action:  "lock_response",
					Seat:    msg.Seat,
					Status:  "failed",
					Message: "Something went wrong! Seat already taken by another user.",
				})
				c.send <- resp
			} else {
				// Lock acquired successfully by this user!
				resp, _ := json.Marshal(WSResponse{
					Action: "lock_response",
					Seat:   msg.Seat,
					Status: "success",
				})
				c.send <- resp

				// Broadcast to all other connected clients that seat is locked
				bcast, _ := json.Marshal(WSResponse{
					Action:   "broadcast_lock",
					Seat:     msg.Seat,
					Status:   "locked",
					ClientID: msg.UserID, // Pass back the frontend's unique user_id
				})
				hub.broadcast <- bcast
			}

		case "unlock":
			UnlockSeat(msg.Seat)
			bcast, _ := json.Marshal(WSResponse{
				Action: "broadcast_release",
				Seat:   msg.Seat,
				Status: "available",
			})
			hub.broadcast <- bcast
		}
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()
	for message := range c.send {
		c.conn.WriteMessage(websocket.TextMessage, message)
	}
}

func handleJoinQueue(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"queued","position":1,"est_wait_sec":0}`))
}

func handleCheckout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	checkoutID := r.URL.Query().Get("checkout_id")
	if !CheckIdempotency(checkoutID) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"duplicate","message":"Checkout already processed"}`))
		return
	}

	remaining, err := DecrementTicketPool()
	if err != nil || remaining < 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"status":"failed","message":"Sold out! Zero tickets remaining."}`))
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf(`{"status":"success","tickets_remaining":%d}`, remaining)))
}
