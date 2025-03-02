// Global variables
let provider, signer, walletAddress;
let contractAddresses = {};
const API_URL = "http://195.201.173.214:49554";

// Monad Testnet configuration
const MONAD_TESTNET_PARAMS = {
    chainId: "0x279f",
    chainName: "Monad Testnet",
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: ["https://testnet-rpc.monad.xyz"],
    blockExplorerUrls: ["https://testnet.monadexplorer.com"]
};

// ==================== WALLET CONNECTION ====================
document.getElementById('connectWallet').addEventListener('click', connectWallet);

async function connectWallet() {
    if (window.ethereum) {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            walletAddress = await signer.getAddress();
            
            document.getElementById('walletAddress').innerText = `Wallet: ${walletAddress}`;
            
            // Switch to Monad Testnet
            await switchToMonad();
            
            // Load user contracts from backend
            await loadUserContracts(walletAddress);
            
            // Update wallet info
            updateBalance();
            updateTransactionCount();
            
            // Enable interaction buttons
            enableInteractionButtons();
        } catch (error) {
            console.error("Wallet connection error:", error);
            alert("Failed to connect wallet: " + error.message);
        }
    } else {
        alert("Please install MetaMask or OKX Wallet");
    }
}

// Switch to Monad Testnet
async function switchToMonad() {
    if (!window.ethereum) {
        alert("Please install MetaMask or OKX Wallet!");
        return;
    }
    
    try {
        await window.ethereum.request({ 
            method: "wallet_switchEthereumChain", 
            params: [{ chainId: MONAD_TESTNET_PARAMS.chainId }] 
        });
    } catch (error) {
        if (error.code === 4902) {
            await window.ethereum.request({ 
                method: "wallet_addEthereumChain", 
                params: [MONAD_TESTNET_PARAMS] 
            });
        } else {
            console.error("Failed to switch network:", error);
            alert("Failed to switch to Monad network: " + error.message);
        }
    }
}

// Update wallet balance
async function updateBalance() {
    if (!walletAddress) return;
    
    try {
        const balance = await provider.getBalance(walletAddress);
        document.getElementById('balance').innerText = `Balance: ${ethers.utils.formatEther(balance)} MON`;
    } catch (error) {
        console.error("Error updating balance:", error);
    }
}

// Update transaction count
async function updateTransactionCount() {
    if (!walletAddress) return;
    
    try {
        const count = await provider.getTransactionCount(walletAddress);
        document.getElementById('transactionCount').innerText = `Transactions: ${count}`;
    } catch (error) {
        console.error("Error updating transaction count:", error);
    }
}

// Delete user data
function confirmDelete() {
    if (confirm("Are you sure you want to delete all stored contract data?")) {
        deleteUserData(walletAddress);
    }
}

async function deleteUserData(wallet) {
    if (!wallet) return;
    
    try {
        await fetch(`${API_URL}/contracts/${wallet}`, {
            method: "DELETE"
        });
        
        alert("Data deleted successfully");
        location.reload();
    } catch (error) {
        console.error("Error deleting data:", error);
        alert("Failed to delete data: " + error.message);
    }
}

// ==================== CONTRACT MANAGEMENT ====================
// Deploy ContractManager (handles multiple contracts)
document.getElementById('deployContractManagerBtn').addEventListener('click', deployContractManager);

async function deployContractManager() {
    if (!walletAddress) {
        alert("Connect your wallet first!");
        return;
    }
    
    try {
        const factory = new ethers.ContractFactory(
            contractABIs.ContractManager, 
            contractSources.ContractManager, 
            signer
        );
        
        const contract = await factory.deploy();
        await contract.deployed();
        
        const managerAddress = contract.address;
        saveContract(walletAddress, "ContractManager", managerAddress);
        
        document.getElementById("ContractManagerAddress").innerText = `Contract Manager: ${managerAddress}`;
        contractAddresses.ContractManager = managerAddress;
        
        // Get all child contract addresses
        await getContractAddresses(managerAddress);
        
        // Update the blockchain tools section
        updateBlockchainTools();
        
        alert("ContractManager deployed successfully!");
    } catch (error) {
        console.error("Deployment error:", error);
        alert("Failed to deploy ContractManager: " + error.message);
    }
}

// Get addresses of child contracts from ContractManager
async function getContractAddresses(managerAddress) {
    if (!managerAddress) return;
    
    try {
        const manager = new ethers.Contract(
            managerAddress, 
            contractABIs.ContractManager, 
            signer
        );
        
        // Get and display addresses
        const tokenAddress = await manager.getTokenAddress();
        const nftAddress = await manager.getNFTAddress();
        const votingAddress = await manager.getVotingAddress();
        const batchAddress = await manager.getBatchAddress();
        
        // Store addresses
        contractAddresses.Token = tokenAddress;
        contractAddresses.NFT = nftAddress;
        contractAddresses.VotingSystem = votingAddress;
        contractAddresses.BatchTransaction = batchAddress;
        
        // Update UI
        document.getElementById("TokenAddress").innerText = `Token: ${tokenAddress}`;
        document.getElementById("NFTAddress").innerText = `NFT: ${nftAddress}`;
        document.getElementById("VotingSystemAddress").innerText = `Voting: ${votingAddress}`;
        document.getElementById("BatchTransactionAddress").innerText = `BatchTx: ${batchAddress}`;
        
        // Save individual contracts
        saveContract(walletAddress, "Token", tokenAddress);
        saveContract(walletAddress, "NFT", nftAddress);
        saveContract(walletAddress, "VotingSystem", votingAddress);
        saveContract(walletAddress, "BatchTransaction", batchAddress);
    } catch (error) {
        console.error("Error fetching contract addresses:", error);
        alert("Failed to get contract addresses: " + error.message);
    }
}

// Update blockchain tools with contract addresses
function updateBlockchainTools() {
    if (contractAddresses.Token) {
        document.getElementById("TokenAddressDisplay").innerText = `Token Contract: ${contractAddresses.Token}`;
    }
    
    if (contractAddresses.NFT) {
        document.getElementById("NFTAddressDisplay").innerText = `NFT Contract: ${contractAddresses.NFT}`;
    }
    
    if (contractAddresses.VotingSystem) {
        document.getElementById("VotingSystemAddressDisplay").innerText = `Voting Contract: ${contractAddresses.VotingSystem}`;
    }
    
    if (contractAddresses.BatchTransaction) {
        document.getElementById("BatchTransactionAddressDisplay").innerText = `Batch Contract: ${contractAddresses.BatchTransaction}`;
    }
}

// ==================== INDIVIDUAL GAME CONTRACTS ====================
// Deploy individual contracts
document.getElementById('deployVirtualPetBtn').addEventListener('click', () => deployIndividualContract('VirtualPet'));
document.getElementById('deployRPSBtn').addEventListener('click', () => deployIndividualContract('RockPaperScissors'));
document.getElementById('deployStakingBtn').addEventListener('click', () => deployIndividualContract('OmonStaking'));
document.getElementById('deployBettingBtn').addEventListener('click', () => deployIndividualContract('BettingGame'));
document.getElementById('deployRandomGMBtn').addEventListener('click', () => deployIndividualContract('RandomGM'));

async function deployIndividualContract(contractName) {
    if (!walletAddress) {
        alert("Connect your wallet first!");
        return;
    }
    
    try {
        const factory = new ethers.ContractFactory(
            contractABIs[contractName], 
            contractSources[contractName], 
            signer
        );
        
        const contract = await factory.deploy();
        await contract.deployed();
        
        const contractAddress = contract.address;
        saveContract(walletAddress, contractName, contractAddress);
        
        document.getElementById(`${contractName}Address`).innerText = `${contractName}: ${contractAddress}`;
        contractAddresses[contractName] = contractAddress;
        
        alert(`${contractName} deployed successfully at ${contractAddress}`);
    } catch (error) {
        console.error(`Deployment error for ${contractName}:`, error);
        alert(`Failed to deploy ${contractName}: ${error.message}`);
    }
}

// ==================== GAME INTERACTIONS ====================
// Virtual Pet interactions
document.getElementById('createPetBtn').addEventListener('click', createPet);
document.getElementById('feedPetBtn').addEventListener('click', feedPet);
document.getElementById('checkPetBtn').addEventListener('click', checkPetStatus);

async function createPet() {
    if (!contractAddresses.VirtualPet) {
        alert("Deploy VirtualPet contract first!");
        return;
    }
    
    const petName = document.getElementById('petName').value;
    if (!petName) {
        alert("Please enter a pet name!");
        return;
    }
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.VirtualPet,
            contractABIs.VirtualPet,
            signer
        );
        
        const tx = await contract.createPet(petName);
        await tx.wait();
        
        document.getElementById('petStatus').innerText = `Pet "${petName}" created successfully!`;
    } catch (error) {
        console.error("Error creating pet:", error);
        document.getElementById('petStatus').innerText = `Error: ${error.message}`;
    }
}

async function feedPet() {
    if (!contractAddresses.VirtualPet) {
        alert("Deploy VirtualPet contract first!");
        return;
    }
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.VirtualPet,
            contractABIs.VirtualPet,
            signer
        );
        
        const tx = await contract.feedPet({ value: ethers.utils.parseEther("0.00002") });
        await tx.wait();
        
        document.getElementById('petStatus').innerText = "Pet fed successfully!";
    } catch (error) {
        console.error("Error feeding pet:", error);
        document.getElementById('petStatus').innerText = `Error: ${error.message}`;
    }
}

async function checkPetStatus() {
    if (!contractAddresses.VirtualPet) {
        alert("Deploy VirtualPet contract first!");
        return;
    }
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.VirtualPet,
            contractABIs.VirtualPet,
            signer
        );
        
        await contract.checkPetStatus();
        const [name, happiness, alive] = await contract.getPetStatus();
        
        document.getElementById('petStatus').innerText = 
            `Name: ${name}, Happiness: ${happiness}%, Status: ${alive ? "Alive" : "Dead"}`;
    } catch (error) {
        console.error("Error checking pet status:", error);
        document.getElementById('petStatus').innerText = `Error: ${error.message}`;
    }
}

// Rock Paper Scissors interactions
document.getElementById('playRockBtn').addEventListener('click', () => playRPS(1));
document.getElementById('playPaperBtn').addEventListener('click', () => playRPS(2));
document.getElementById('playScissorsBtn').addEventListener('click', () => playRPS(3));

async function playRPS(move) {
    if (!contractAddresses.RockPaperScissors) {
        alert("Deploy RockPaperScissors contract first!");
        return;
    }
    
    const moveNames = ["None", "Rock", "Paper", "Scissors"];
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.RockPaperScissors,
            contractABIs.RockPaperScissors,
            signer
        );
        
        const tx = await contract.play(move);
        await tx.wait();
        
        const [result, playerMove, contractMove] = await contract.getGameResult();
        
        document.getElementById('rpsResult').innerText = 
            `Result: ${result} (You: ${moveNames[playerMove]}, Computer: ${moveNames[contractMove]})`;
    } catch (error) {
        console.error("Error playing RPS:", error);
        document.getElementById('rpsResult').innerText = `Error: ${error.message}`;
    }
}

// OMON Staking interactions
document.getElementById('stakeBtn').addEventListener('click', stake);
document.getElementById('unstakeBtn').addEventListener('click', unstake);

async function stake() {
    if (!contractAddresses.OmonStaking) {
        alert("Deploy OmonStaking contract first!");
        return;
    }
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.OmonStaking,
            contractABIs.OmonStaking,
            signer
        );
        
        const tx = await contract.stake({ value: ethers.utils.parseEther("0.01") });
        await tx.wait();
        
        const stakedBalance = await contract.getStakedBalance(walletAddress);
        const omonBalance = await contract.getOmonBalance(walletAddress);
        
        document.getElementById('stakingStatus').innerText = 
            `Staked: ${ethers.utils.formatEther(stakedBalance)} MON, OMON Balance: ${ethers.utils.formatEther(omonBalance)}`;
        
        updateBalance();
    } catch (error) {
        console.error("Error staking:", error);
        document.getElementById('stakingStatus').innerText = `Error: ${error.message}`;
    }
}

async function unstake() {
    if (!contractAddresses.OmonStaking) {
        alert("Deploy OmonStaking contract first!");
        return;
    }
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.OmonStaking,
            contractABIs.OmonStaking,
            signer
        );
        
        const amount = ethers.utils.parseEther("0.01");
        const tx = await contract.unstake(amount);
        await tx.wait();
        
        const stakedBalance = await contract.getStakedBalance(walletAddress);
        const omonBalance = await contract.getOmonBalance(walletAddress);
        
        document.getElementById('stakingStatus').innerText = 
            `Staked: ${ethers.utils.formatEther(stakedBalance)} MON, OMON Balance: ${ethers.utils.formatEther(omonBalance)}`;
        
        updateBalance();
    } catch (error) {
        console.error("Error unstaking:", error);
        document.getElementById('stakingStatus').innerText = `Error: ${error.message}`;
    }
}

// Betting Game interactions
document.getElementById('placeBetBtn').addEventListener('click', placeBet);

async function placeBet() {
    if (!contractAddresses.BettingGame) {
        alert("Deploy BettingGame contract first!");
        return;
    }
    
    const betNumber = document.getElementById('betNumber').value;
    if (!betNumber || betNumber < 1 || betNumber > 10) {
        alert("Please enter a number between 1 and 10!");
        return;
    }
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.BettingGame,
            contractABIs.BettingGame,
            signer
        );
        
        // Listen for BetResult event
        contract.once("BetResult", (player, betNum, randomNum, won) => {
            document.getElementById('betResult').innerText = 
                `You bet on ${betNum}, Random number: ${randomNum}, Result: ${won ? "You won!" : "You lost!"}`;
            
            updateBalance();
        });
        
        const tx = await contract.placeBet(betNumber, { value: ethers.utils.parseEther("0.01") });
        await tx.wait();
    } catch (error) {
        console.error("Error placing bet:", error);
        document.getElementById('betResult').innerText = `Error: ${error.message}`;
    }
}

// اتصال دکمه به تابع
document.getElementById('getMessageBtn').addEventListener('click', getMessage);

async function getMessage() {
    if (!contractAddresses.RandomGM) {
        alert("Deploy RandomGM contract first!");
        return;
    }
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.RandomGM,
            contractABIs.RandomGM,
            signer
        );

        // ارسال تراکنش
        const tx = await contract.getMessage();
        await tx.wait(); // صبر برای تایید تراکنش

        // خواندن مقدار پیام مستقیماً از تابع
        const message = await contract.getMessage();
        document.getElementById('randomMessage').innerText = message;

    } catch (error) {
        console.error("Error getting message:", error);
        document.getElementById('randomMessage').innerText = `Error: ${error.message}`;
    }
}

// ==================== BLOCKCHAIN TOOLS INTERACTIONS ====================
// Token interactions
document.getElementById('mintTokenBtn').addEventListener('click', mintToken);
document.getElementById('transferTokenBtn').addEventListener('click', transferToken);

async function mintToken() {
    if (!contractAddresses.Token) {
        alert("Deploy ContractManager first!");
        return;
    }
    
    const tokenName = document.getElementById('tokenName').value;
    const amount = document.getElementById('tokenAmount').value;
    
    if (!tokenName || !amount || amount <= 0) {
        alert("Please enter valid token name and amount!");
        return;
    }
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.Token,
            contractABIs.Token,
            signer
        );
        
        const tx = await contract.mint(walletAddress, amount);
        await tx.wait();
        
        document.getElementById('tokenStatus').innerText = `Minted ${amount} ${tokenName} tokens!`;
    } catch (error) {
        console.error("Error minting token:", error);
        document.getElementById('tokenStatus').innerText = `Error: ${error.message}`;
    }
}

async function transferToken() {
    if (!contractAddresses.Token) {
        alert("Deploy ContractManager first!");
        return;
    }
    
    const transferTo = document.getElementById('transferTo').value;
    const amount = document.getElementById('tokenAmount').value;
    
    if (!ethers.utils.isAddress(transferTo) || !amount || amount <= 0) {
        alert("Please enter valid recipient address and amount!");
        return;
    }
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.Token,
            contractABIs.Token,
            signer
        );
        
        // Get current balance (depends on your token contract)
        const balance = await contract.balances(walletAddress);
        
        if (balance < amount) {
            alert("Insufficient token balance!");
            return;
        }
        
        const tx = await contract.transfer(transferTo, amount);
        await tx.wait();
        
        document.getElementById('tokenStatus').innerText = `Transferred ${amount} tokens to ${transferTo}!`;
    } catch (error) {
        console.error("Error transferring token:", error);
        document.getElementById('tokenStatus').innerText = `Error: ${error.message}`;
    }
}

// NFT interactions
document.getElementById('mintNFTBtn').addEventListener('click', mintNFT);

async function mintNFT() {
    if (!contractAddresses.NFT) {
        alert("Deploy ContractManager first!");
        return;
    }
    
    const nftName = document.getElementById('nftName').value;
    
    if (!nftName) {
        alert("Please enter an NFT name!");
        return;
    }
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.NFT,
            contractABIs.NFT,
            signer
        );
        
        const tx = await contract.mint(walletAddress, nftName);
        await tx.wait();
        
        document.getElementById('nftStatus').innerText = `Minted NFT: ${nftName}!`;
    } catch (error) {
        console.error("Error minting NFT:", error);
        document.getElementById('nftStatus').innerText = `Error: ${error.message}`;
    }
}

// Voting System interactions
document.getElementById('voteYesBtn').addEventListener('click', () => vote("Yes"));
document.getElementById('voteNoBtn').addEventListener('click', () => vote("No"));

async function vote(option) {
    if (!contractAddresses.VotingSystem) {
        alert("Deploy ContractManager first!");
        return;
    }
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.VotingSystem,
            contractABIs.VotingSystem,
            signer
        );
        
        const tx = await contract.vote(option);
        await tx.wait();
        
// Get current votes (depends on your voting contract)
const yesVotes = await contract.getVotes("Yes");
const noVotes = await contract.getVotes("No");

document.getElementById('votingStatus').innerText = 
    `Current votes: Yes (${yesVotes}), No (${noVotes})`;

} catch (error) {
    console.error("Error voting:", error);
    document.getElementById('votingStatus').innerText = `Error: ${error.message}`;
}
}

// Batch Transaction interactions
document.getElementById('sendBatchBtn').addEventListener('click', sendBatch);
document.getElementById('generateWalletsBtn').addEventListener('click', generateWallets);
document.getElementById('useGeneratedWalletsBtn').addEventListener('click', useGeneratedWallets);

async function sendBatch() {
    if (!contractAddresses.BatchTransaction) {
        alert("Deploy ContractManager first!");
        return;
    }
    
    const recipients = document.getElementById('batchRecipients').value;
    const amount = document.getElementById('batchAmount').value;
    
    if (!recipients || !amount || amount <= 0) {
        alert("Please enter valid recipient addresses and amount!");
        return;
    }
    
    // Split the recipients by commas and trim whitespace
    const recipientList = recipients.split(',').map(addr => addr.trim());
    
    // Validate all addresses
    for (const addr of recipientList) {
        if (!ethers.utils.isAddress(addr)) {
            alert(`Invalid address: ${addr}`);
            return;
        }
    }
    
    try {
        const contract = new ethers.Contract(
            contractAddresses.BatchTransaction,
            contractABIs.BatchTransaction,
            signer
        );
        
        const totalAmount = ethers.utils.parseEther((amount * recipientList.length).toString());
        
        // First approve the BatchTransaction contract to spend tokens
        const tokenContract = new ethers.Contract(
            contractAddresses.Token,
            contractABIs.Token,
            signer
        );
        
        const approveTx = await tokenContract.approve(contractAddresses.BatchTransaction, totalAmount);
        await approveTx.wait();
        
        const tx = await contract.batchTransfer(recipientList, ethers.utils.parseEther(amount.toString()));
        await tx.wait();
        
        document.getElementById('batchStatus').innerText = 
            `Successfully sent ${amount} tokens to ${recipientList.length} recipients!`;
    } catch (error) {
        console.error("Error sending batch:", error);
        document.getElementById('batchStatus').innerText = `Error: ${error.message}`;
    }
}

// Generate multiple wallet addresses
async function generateWallets() {
    const count = document.getElementById('walletCount').value;
    
    if (!count || count <= 0 || count > 20) {
        alert("Please enter a valid number of wallets (1-20)!");
        return;
    }
    
    try {
        // Clear previous wallets
        document.getElementById('generatedWallets').innerHTML = '';
        
        // Create a container for wallets
        const container = document.createElement('div');
        container.className = 'wallet-list';
        
        // Generate wallets
        let wallets = [];
        for (let i = 0; i < count; i++) {
            const wallet = ethers.Wallet.createRandom();
            wallets.push({
                address: wallet.address,
                privateKey: wallet.privateKey
            });
            
            // Create wallet display
            const walletElement = document.createElement('div');
            walletElement.className = 'wallet-item';
            walletElement.innerHTML = `
                <div><strong>Address:</strong> ${wallet.address}</div>
                <div><strong>Private Key:</strong> ${wallet.privateKey}</div>
            `;
            container.appendChild(walletElement);
        }
        
        // Store wallets for later use
        window.generatedWallets = wallets;
        
        // Show results
        document.getElementById('generatedWallets').appendChild(container);
    } catch (error) {
        console.error("Error generating wallets:", error);
        alert("Failed to generate wallets: " + error.message);
    }
}

// Use generated wallets in batch transaction
function useGeneratedWallets() {
    if (!window.generatedWallets || window.generatedWallets.length === 0) {
        alert("Please generate wallets first!");
        return;
    }
    
    // Extract addresses and join with commas
    const addresses = window.generatedWallets.map(wallet => wallet.address).join(',');
    
    // Set in batch recipients textarea
    document.getElementById('batchRecipients').value = addresses;
    
    alert(`Added ${window.generatedWallets.length} wallets to batch transaction!`);
}

// ==================== BACKEND INTEGRATION ====================
// Save contract address to backend
async function saveContract(wallet, contractType, address) {
    if (!wallet || !contractType || !address) return;
    
    try {
        await fetch(`${API_URL}/contracts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                wallet,
                contractType,
                address
            })
        });
    } catch (error) {
        console.error("Error saving contract:", error);
    }
}

// Load user contracts from backend
async function loadUserContracts(wallet) {
    if (!wallet) return;
    
    try {
        const response = await fetch(`${API_URL}/contracts/${wallet}`);
        const contracts = await response.json();
        
        // Update contractAddresses object
        for (const contract of contracts) {
            contractAddresses[contract.contractType] = contract.address;
            
            // Update UI
            const element = document.getElementById(`${contract.contractType}Address`);
            if (element) {
                element.innerText = `${contract.contractType}: ${contract.address}`;
            }
        }
        
        // Update blockchain tools
        updateBlockchainTools();
    } catch (error) {
        console.error("Error loading contracts:", error);
    }
}

// Enable interaction buttons
function enableInteractionButtons() {
    // Fetch latest state of each contract
    // This can be expanded to update UI based on contract state
    if (contractAddresses.VirtualPet) {
        checkPetStatus();
    }
    
    if (contractAddresses.OmonStaking) {
        // Update staking info
        const contract = new ethers.Contract(
            contractAddresses.OmonStaking,
            contractABIs.OmonStaking,
            signer
        );
        
        contract.getStakedBalance(walletAddress).then(stakedBalance => {
            contract.getOmonBalance(walletAddress).then(omonBalance => {
                document.getElementById('stakingStatus').innerText = 
                    `Staked: ${ethers.utils.formatEther(stakedBalance)} MON, OMON Balance: ${ethers.utils.formatEther(omonBalance)}`;
            });
        });
    }
    
    if (contractAddresses.VotingSystem) {
        // Update voting info
        const contract = new ethers.Contract(
            contractAddresses.VotingSystem,
            contractABIs.VotingSystem,
            signer
        );
        
        contract.getVotes("Yes").then(yesVotes => {
            contract.getVotes("No").then(noVotes => {
                document.getElementById('votingStatus').innerText = 
                    `Current votes: Yes (${yesVotes}), No (${noVotes})`;
            });
        });
    }
}

// ==================== EVENT LISTENERS FOR UI UPDATES ====================
// Listen for MetaMask account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            console.log('Please connect to MetaMask.');
        } else {
            console.log('Account changed to:', accounts[0]);
            // Refresh the page to reset the state
            location.reload();
        }
    });

    window.ethereum.on('chainChanged', (chainId) => {
        // Handle the new chain
        console.log('Network changed to:', chainId);
        if (chainId !== MONAD_TESTNET_PARAMS.chainId) {
            alert("Please switch to Monad Testnet!");
        }
        // Refresh the page to reset the state
        location.reload();
    });
}

// Auto-connect wallet if cached
window.addEventListener('load', async () => {
    if (window.ethereum && window.ethereum.selectedAddress) {
        connectWallet();
    }
});

// Periodic UI updates
setInterval(() => {
    if (walletAddress) {
        updateBalance();
        updateTransactionCount();
    }
}, 10000); // Update every 10 seconds