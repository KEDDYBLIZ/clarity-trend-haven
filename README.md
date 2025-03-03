# TrendHaven
A curated marketplace for trending lifestyle products built on the Stacks blockchain.

## Features
- List products for sale with details and pricing
- Purchase products using STX tokens
- Product curation system with trending metrics
- Seller and product verification
- Order history tracking

## Setup and Installation
1. Clone the repository
2. Install Clarinet
3. Run `clarinet check` to verify contracts
4. Run `clarinet test` to execute test suite

## Usage Examples
```clarity
;; List a new product (seller only)
(contract-call? .trend-haven list-product "Cool Product" u1000 u50 "Description")

;; Purchase a product
(contract-call? .trend-haven purchase-product u1 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

;; Get product details
(contract-call? .trend-haven get-product-details u1)
```

## Dependencies
- Clarity
- Clarinet
- STX token for transactions
