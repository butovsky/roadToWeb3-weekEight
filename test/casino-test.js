const chai = require("chai")
const { ethers } = require("hardhat")
const expect = chai.expect
chai.use(require('chai-as-promised'))

const valA = ethers.utils.keccak256(0xBAD060A7)
const hashA = ethers.utils.keccak256(valA)
const valBwin = ethers.utils.keccak256(0x600D60A7)
const hashBwin = ethers.utils.keccak256(valBwin)
const valBlose = ethers.utils.keccak256(0xBAD060A7)
const hashBlose = ethers.utils.keccak256(valBlose)

// Chai's expect(<operation>).to.be.revertedWith behaves
// strangely, so I'm implementing that functionality myself
// with try/catch
const interpretErr = err => {
  if (err.reason)
    return err.reason
  else
    return err.stackTrace[0].message.value.toString('ascii')
}

describe("Casino", async () => {
  it("Not allow you to propose a zero wei bet", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    try {
      tx = await c.proposeBet(hashA)
      rcpt = await tx.wait()

      // If we get here, it's a fail
      expect("this").to.equal("fail")
    } catch(err) {
      expect(interpretErr(err)).to
        .match(/you need to actually bet something/)
    }
  })   // it "Not allow you to bet zero wei"

  it("Not allow you to accept a bet that doesn't exist", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    try {
      tx = await c.acceptBet(hashA, hashBwin, {value: 10})
      rcpt = await tx.wait()
      expect("this").to.equal("fail")
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Nobody made that bet/)
    }
  })   // it "Not allow you to accept a bet that doesn't exist" 

  it("Allow you to propose and accept bets", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    tx = await c.acceptBet(hashA, hashBwin, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")      
  })   // it "Allow you to accept a bet"

  it("Not allow you to accept an already accepted bet", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    tx = await c.acceptBet(hashA, hashBwin, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")
    try {
      tx = await c.acceptBet(hashA, hashBwin, {value: 10})
      rcpt = await tx.wait()   
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Bet has already been accepted/)
    }          
  })   // it "Not allow you to accept an already accepted bet" 


  it("Not allow you to accept with the wrong amount", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    try {
      tx = await c.acceptBet(hashA, hashBwin, {value: 11})
      rcpt = await tx.wait()   
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Need to bet the same amount as sideA/)
    }          
  })   // it "Not allow you to accept with the wrong amount"   


  it("Not allow you to reveal with wrong value", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    tx = await c.acceptBet(hashA, hashBwin, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")
    try {
      tx = await c.reveal(hashA, ethers.utils.keccak256(valBwin))
      rcpt = await tx.wait()   
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Not a bet you placed or wrong value/)
    }          
  })   // it "Not allow you to accept an already accepted bet" 


  it("Not allow you to reveal before bet is accepted", async () => {
    f = await ethers.getContractFactory("Casino")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    try {
      tx = await c.reveal(hashA, valA)
      rcpt = await tx.wait()
      expect("this").to.equal("fail")   
    } catch (err) {
      expect(interpretErr(err)).to
        .match(/Bet has not been accepted yet/)
    }
  })   // it "Not allow you to settle before bet is accepted"  

  it("Not allow you to settle before all are revealed", async () => {
    signer = await ethers.getSigners()
    f = await ethers.getContractFactory("Casino")
    cA = await f.deploy()
    cB = cA.connect(signer[1])

    tx = await cA.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")

    tx = await cB.acceptBet(hashA, hashBwin, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")
    try {
      await cA.reveal(hashA, valA); // only one is revealed
      tx = await cA.settle(hashA, hashBwin)
      rcpt = await tx.wait()   
      expect("this").to.equal("fail")   
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Not all numbers are revealed, while the timer is not up!/)
    }          
  })   // it "Not allow you to reveal before bet is accepted"  

  it("Work all the way through (B wins)", async () => {
    signer = await ethers.getSigners()
    f = await ethers.getContractFactory("Casino")
    cA = await f.deploy()
    cB = cA.connect(signer[1])

    tx = await cA.proposeBet(hashA, {value: 1e15})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")

    tx = await cB.acceptBet(hashA, hashBwin, {value: 1e15})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")      

    // A sends the transaction, so the change due to the
    // bet will only be clearly visible in B

    await cA.reveal(hashA, valA);
    await cB.reveal(hashBlose, valBwin);

    preBalanceB = await ethers.provider.getBalance(signer[1].address)   

    tx = await cA.settle(hashA, hashBwin);
    rcpt = await tx.wait();
    expect(rcpt.events[0].event).to.equal("BetSettled")
    postBalanceB = await ethers.provider.getBalance(signer[1].address)  
    deltaB = postBalanceB.sub(preBalanceB)
    expect(deltaB.toNumber()).to.equal(2e15)   


  })   // it "Work all the way through (B wins)"


  it("Work all the way through (A wins)", async () => {
    signer = await ethers.getSigners()
    f = await ethers.getContractFactory("Casino")
    cA = await f.deploy()
    cB = cA.connect(signer[1])

    tx = await cA.proposeBet(hashA, {value: 1e15})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")

    tx = await cB.acceptBet(hashA, hashBlose, {value: 1e15})
    
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")      

    // A sends the transaction, so the change due to the
    // bet will only be clearly visible in B

    await cA.reveal(hashA, valA);
    await cB.reveal(hashBlose, valBlose);

    preBalanceB = await ethers.provider.getBalance(signer[1].address)

    tx = await cA.settle(hashA, hashBlose);
    rcpt = await tx.wait();
    expect(rcpt.events[0].event).to.equal("BetSettled")
    postBalanceB = await ethers.provider.getBalance(signer[1].address)        
    deltaB = postBalanceB.sub(preBalanceB)
    expect(deltaB.toNumber()).to.equal(0) 
  })   // it "Work all the way through (A wins)"


})     // describe("Casino")
