import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Test product listing",
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
  name: "Test product purchase",
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
    const response = chain.callReadOnlyFn('trend-haven', 'get-product-details',
      [types.uint(1)], deployer.address);
      
    const product = response.result.expectOk().expectSome();
    assertEquals(product.quantity, 8);
  }
});

Clarinet.test({
  name: "Test product verification",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const seller = accounts.get('wallet_1')!;
    
    // List product
    let block = chain.mineBlock([
      Tx.contractCall('trend-haven', 'list-product',
        [types.ascii("Test Product"), types.uint(100), types.uint(10),
         types.ascii("Test Description")], seller.address)
    ]);
    
    // Verify product
    block = chain.mineBlock([
      Tx.contractCall('trend-haven', 'verify-product',
        [types.uint(1)], deployer.address)
    ]);
    
    block.receipts[0].result.expectOk();
    
    const response = chain.callReadOnlyFn('trend-haven', 'get-product-details',
      [types.uint(1)], deployer.address);
      
    const product = response.result.expectOk().expectSome();
    assertEquals(product.verified, true);
  }
});
