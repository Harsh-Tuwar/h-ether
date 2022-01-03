import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { contractAbi, contractAddress } from '../utils/constants';

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContact = () => {
	const provider = new ethers.providers.Web3Provider(ethereum);
	const signer = provider.getSigner();
	const transactionContract = new ethers.Contract(contractAddress, contractAbi, signer);

	return transactionContract;
}

export const TransactionProvider = ({ children }) => {
	const [currentAccount, setCurrentAccount] = useState('');
	const [loading, setLoading] = useState(false);
	const [transactions, setTransactions] = useState([]);
	const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));
	const [fetchTransactions, setFetchTransactions] = useState(false);
	const [formData, setFormData] = useState({ adddressTo: '', amount: '', keyword: '', message: '' });
	
	const handleChange = (e, name) => {
		setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
	}

	const getAllTransactions = async () => {
		try {
			checkIfMetamaskInstalled();

			const transactionContract = getEthereumContact();
			const availableTransactions = await transactionContract.getAllTransactions(); 

			const structuredTransactions = availableTransactions.map((transaction) => ({
				addressTo: transaction.receiver,
				addressFrom: transaction.sender,
				timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
				message: transaction.message,
				keyword: transaction.keyword,
				amount: parseInt(transaction.amount._hex) / (10 ** 18) // in ETH
			}));

			setTransactions(structuredTransactions);
		} catch (error) {
			console.error(error);
			throw new Error('No ethereum object.');
		}
	}

	const checkIfMetamaskInstalled = () => {
		if (!ethereum) {
			return alert('Please install metamask!');
		}
	}

	const checkIfWalletIsConnected = async () => {
		try {
			checkIfMetamaskInstalled();
	
			const accounts = await ethereum.request({ method: 'eth_accounts' });
	
			if (accounts.length) {
				setCurrentAccount(accounts[0]);
				getAllTransactions();
			}
	
			console.log(accounts);	
		} catch (error) {
			console.error(error);
			throw new Error('No ethereum object.');
		}	
	}

	const checkIfTransactionsExist = async () => {
		try {
			const transactionContract = getEthereumContact();
			const transactionCount = await transactionContract.getTransactionCount();

			window.localStorage.setItem("transactionCount", transactionCount);
		} catch (error) {
			console.error(error);
			throw new Error('No ethereum object.');
		}	
	}

	const connectWallet = async () => {
		try {
			checkIfMetamaskInstalled();

			const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.error(error);
			throw new Error('No ethereum object.');
		}
	}

	const sendTransaction = async () => {
		try {
			checkIfMetamaskInstalled();

			const { addressTo, amount, keyword, message } = formData;
			const transactionContract = getEthereumContact();
			const parsedAmount = ethers.utils.parseEther(amount);

			await ethereum.request({
				method: 'eth_sendTransaction',
				params: [{
					from: currentAccount,
					to: addressTo,
					gas: '0x5208', // 21000 gwei
					value: parsedAmount._hex,
				}]
			});

			const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

			setLoading(true);
			console.log(`Loading - ${transactionHash.hash}...`);

			await transactionHash.wait();

			setLoading(false);
			console.log(`Success - ${transactionHash.hash}`);

			const transactionCount = await transactionContract.getTransactionCount();
			setTransactionCount(transactionCount.toNumber());

			setFormData({ adddressTo: '', amount: '', keyword: '', message: '' });
			setFetchTransactions(true);
		} catch (error) {
			console.error(error);

			throw new Error(error);
		}
	}

	useEffect(() => {
		checkIfWalletIsConnected();
		checkIfTransactionsExist();
	}, [fetchTransactions]);

	return (
		<TransactionContext.Provider value={{ connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction, transactions, loading }}>
			{children}
		</TransactionContext.Provider>
	)
}