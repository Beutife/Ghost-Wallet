// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZKProofVerifier {
    
    
    mapping(bytes32 => bool) public usedProofs;
    
    event ProofVerified(bytes32 indexed proofHash, bool isValid);
    
   
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicSignals
    ) public pure returns (bool isValid) {
        require(proof.length > 0, "Empty proof");
        require(publicSignals.length > 0, "Empty signals");
        
        // TODO: Replace with actual Groth16 verifier
        // For hackathon demo: return true if inputs are valid
        return true;
    }
    
    
    function verifyAndRecord(
        bytes calldata proof,
        uint256[] calldata publicSignals
    ) external returns (bool isValid) {
        
        bytes32 proofHash = keccak256(abi.encodePacked(proof, publicSignals));
        
       
        require(!usedProofs[proofHash], "Proof already used");
        
    
        isValid = verifyProof(proof, publicSignals);
        require(isValid, "Invalid proof");
        
      
        usedProofs[proofHash] = true;
        
        emit ProofVerified(proofHash, isValid);
        
        return isValid;
    }
    
   
    function isProofUsed(bytes32 proofHash) external view returns (bool) {
        return usedProofs[proofHash];
    }
}