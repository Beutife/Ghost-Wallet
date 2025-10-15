import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GhostFactoryModule = buildModule("GhostFactoryModule", (m) => {
  // Deploy the factory (no constructor parameters needed)
  const ghostFactory = m.contract("GhostFactory");

  return { ghostFactory };
});

export default GhostFactoryModule;