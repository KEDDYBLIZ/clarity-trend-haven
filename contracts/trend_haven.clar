;; TrendHaven Marketplace Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-invalid-price (err u102))
(define-constant err-unauthorized (err u103))
(define-constant err-insufficient-funds (err u104))

;; Data Variables
(define-data-var next-product-id uint u1)
(define-data-var admin principal contract-owner)

;; Maps
(define-map Products
  uint 
  {
    name: (string-ascii 100),
    price: uint,
    quantity: uint,
    seller: principal,
    description: (string-ascii 500),
    trending-score: uint,
    verified: bool
  }
)

(define-map Orders
  uint 
  {
    buyer: principal,
    product-id: uint,
    quantity: uint,
    timestamp: uint
  }
)

(define-map SellerInfo
  principal
  {
    verified: bool,
    products-sold: uint,
    total-sales: uint
  }
)

;; Public Functions
(define-public (list-product (name (string-ascii 100)) (price uint) (quantity uint) (description (string-ascii 500)))
  (let ((product-id (var-get next-product-id)))
    (asserts! (> price u0) err-invalid-price)
    (try! (create-or-update-seller))
    (map-set Products product-id 
      {
        name: name,
        price: price,
        quantity: quantity,
        seller: tx-sender,
        description: description,
        trending-score: u0,
        verified: false
      }
    )
    (var-set next-product-id (+ product-id u1))
    (ok product-id)
  )
)

(define-public (purchase-product (product-id uint) (quantity uint))
  (let (
    (product (unwrap! (map-get? Products product-id) err-not-found))
    (total-cost (* (get price product) quantity))
  )
    (asserts! (<= quantity (get quantity product)) err-not-found)
    (try! (stx-transfer? total-cost tx-sender (get seller product)))
    (try! (update-product-quantity product-id quantity))
    (try! (record-order product-id quantity))
    (try! (update-trending-score product-id))
    (ok true)
  )
)

;; Admin Functions
(define-public (verify-product (product-id uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) err-owner-only)
    (match (map-get? Products product-id)
      product (ok (map-set Products product-id 
        (merge product { verified: true })))
      err-not-found
    )
  )
)

;; Internal Functions
(define-private (create-or-update-seller)
  (let ((seller-exists (default-to 
    { verified: false, products-sold: u0, total-sales: u0 }
    (map-get? SellerInfo tx-sender))))
    (ok (map-set SellerInfo tx-sender seller-exists))
  )
)

(define-private (update-product-quantity (product-id uint) (quantity uint))
  (match (map-get? Products product-id)
    product (ok (map-set Products product-id 
      (merge product { quantity: (- (get quantity product) quantity) })))
    err-not-found
  )
)

(define-private (record-order (product-id uint) (quantity uint))
  (let ((order-id (var-get next-product-id)))
    (map-set Orders order-id
      {
        buyer: tx-sender,
        product-id: product-id,
        quantity: quantity,
        timestamp: block-height
      }
    )
    (ok true)
  )
)

(define-private (update-trending-score (product-id uint))
  (match (map-get? Products product-id)
    product (ok (map-set Products product-id 
      (merge product { trending-score: (+ (get trending-score product) u1) })))
    err-not-found
  )
)

;; Read Functions
(define-read-only (get-product-details (product-id uint))
  (ok (map-get? Products product-id))
)

(define-read-only (get-seller-info (seller principal))
  (ok (map-get? SellerInfo seller))
)
