//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Casino {

  struct ProposedBet {
    address sideA;
    uint randomA;
    uint value;
    bool revealed;
    bool accepted;   
  }    // struct ProposedBet


  struct AcceptedBet {
    address sideB;
    uint commitmentB;
    uint randomB;
    bool revealed;
    uint acceptedAt;
  }   // struct AcceptedBet

  // Proposed bets, keyed by the commitment value
  mapping(uint => ProposedBet) public proposedBet;

  // Accepted bets, also keyed by commitment value
  mapping(uint => AcceptedBet) public acceptedBet;
  


  event BetProposed (
    uint indexed _commitmentA,
    uint value
  );

  event BetAccepted (
    uint indexed _commitmentA,
    address indexed _sideA
  );


  event BetSettled (
    uint indexed _commitment,
    address winner,
    address loser,
    uint value    
  );

  uint settleTime = 60 seconds;
  address owner;

  constructor() {
    owner = msg.sender;
  }

  function getValue(uint _commitmentA) external view returns (uint) {
    return proposedBet[_commitmentA].value;
  }
  
  function proposeBet(uint _commitmentA) external payable {
    require(proposedBet[_commitmentA].value == 0,
      "there is already a bet on that commitment");
    require(msg.value > 0,
      "you need to actually bet something");

    proposedBet[_commitmentA].sideA = msg.sender;
    proposedBet[_commitmentA].value = msg.value;

    emit BetProposed(_commitmentA, msg.value);
  }  // function proposeBet


  // Called by sideB to continue
  function acceptBet(uint _commitmentA, uint _commitmentB) external payable {

    require(!proposedBet[_commitmentA].accepted,
      "Bet has already been accepted");
    require(proposedBet[_commitmentA].sideA != address(0),
      "Nobody made that bet");
    require(msg.value == proposedBet[_commitmentA].value,
      "Need to bet the same amount as sideA");

    acceptedBet[_commitmentB].sideB = msg.sender;
    acceptedBet[_commitmentB].acceptedAt = block.timestamp;

    proposedBet[_commitmentA].accepted = true;

    emit BetAccepted(_commitmentA, proposedBet[_commitmentA].sideA);
  }   // function acceptBet

  function reveal(uint _commitmentA, uint _random) external{      
    require(proposedBet[_commitmentA].accepted,
      "Bet has not been accepted yet");
      
    uint _commitment = uint256(keccak256(abi.encodePacked(_random)));
    
    if (proposedBet[_commitment].sideA == msg.sender) {
      proposedBet[_commitment].randomA = _random;
      proposedBet[_commitment].revealed = true;
    } else if (acceptedBet[_commitment].sideB == msg.sender) {
      acceptedBet[_commitment].randomB = _random;
      acceptedBet[_commitment].revealed = true;
    } else {
      require(false, "Not a bet you placed or wrong value");
    }
  }

  // Called by any side to conclude the bet
  function settle(uint _commitmentA, uint _commitmentB) external{
    require(proposedBet[_commitmentA].accepted,
      "Bet has not been accepted yet");
    
    address payable _sideA = payable(proposedBet[_commitmentA].sideA);
    address payable _sideB = payable(acceptedBet[_commitmentB].sideB);
    uint _value = proposedBet[_commitmentA].value;

    if (proposedBet[_commitmentA].revealed && acceptedBet[_commitmentB].revealed) {
      uint _agreedRandom = proposedBet[_commitmentA].randomA ^ acceptedBet[_commitmentB].randomB;
      // Pay and emit an event
      if (_agreedRandom % 2 == 0) {
        // sideA wins
        _sideA.transfer(2*_value);
        emit BetSettled(_commitmentA, _sideA, _sideB, _value);
      } else {
        // sideB wins
        _sideB.transfer(2*_value);
        emit BetSettled(_commitmentA, _sideB, _sideA, _value);      
      }

      // Cleanup
      delete proposedBet[_commitmentA];
      delete acceptedBet[_commitmentB];

    } else {
      require(block.timestamp - acceptedBet[_commitmentB].acceptedAt > 120 seconds, "Not all numbers are revealed, while the timer is not up!");
      if (proposedBet[_commitmentA].revealed) {
        _sideA.transfer(2*_value);
      } else if (acceptedBet[_commitmentB].revealed) {
        _sideB.transfer(2*_value);
      } else {
        payable(owner).transfer(2*_value); // punishment for afk lol, can be changed in every possible way (e.g. locking f)
      }
      delete proposedBet[_commitmentA];
      delete acceptedBet[_commitmentB];
      
    }
  }  // function reveal
}   // contract Casino
