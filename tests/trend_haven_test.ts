import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Test product listing with valid inputs",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const seller = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('trend-haven', 'list-product',
        [types.ascii("Test Product"), types.uint(1000), types.uint(10), 
         types.ascii("Test Description")], seller.address)
    ]);
    
    block.receipts[0].result.expectOk().expectUint(1);
    
    const response = chain.callReadOnlyFn('trend-haven', 'get-product-details',
      [types.uint(1)], deployer.address);
      
    response.result.expectOk().expectSome();
  }
});

Clarinet.test({
  name: "Test product listing with invalid inputs",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const seller = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('trend-haven', 'list-product',
        [types.ascii("Test Product"), types.uint(0), types.uint(10), 
         types.ascii("Test Description")], seller.address)
    ]);
    
    block.receipts[0].result.expectErr(102); // err-invalid-price
  }
});

Clarinet.test({
  name: "Test product purchase and seller stats update",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const seller = accounts.get('wallet_1')!;
    const buyer = accounts.get('wallet_2')!;
    
    // List product
    let block = chain.mineBlock([
      Tx.contractCall('trend-haven', 'list-product',
        [types.ascii("Test Product"), types.uint(100), types.uint(10),
         types.ascii("Test Description")], seller.address)
    ]);
    
    // Purchase product
    block = chain.mineBlock([
      Tx.contractCall('trend-haven', 'purchase-product',
        [types.uint(1), types.uint(2)], buyer.address)
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Verify updated quantity
    const productResponse = chain.callReadOnlyFn('trend-haven', 'get-product-details',
      [types.uint(1)], deployer.address);
      
    const product = productResponse.result.expectOk().expectSome();
    assertEquals(product.quantity, 8);

    // Verify seller stats
    const sellerResponse = chain.callReadOnlyFn('trend-haven', 'get-seller-info',
      [types.principal(seller.address)], deployer.address);
      
    const sellerInfo = sellerResponse.result.expectOk().expectSome();
    assertEquals(sellerInfo['products-sold'], 2);
    assertEquals(sellerInfo['total-sales'], 200);
  }
});
