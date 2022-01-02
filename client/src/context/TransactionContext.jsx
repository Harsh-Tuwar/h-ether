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
	const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));
	const [formData, setFormData] = useState({ adddressTo: '', amount: '', keyword: '', message: '' });
	
	const handleChange = (e, name) => {
		setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
	}

	const performWalletCheck = () => {
		if (!ethereum) {
			return alert('Please install metamask!');
		}
	}

	const checkIfWalletIsConnected = async () => {
		try {
			performWalletCheck();
	
			const accounts = await ethereum.request({ method: 'eth_accounts' });
	
			if (accounts.length) {
				setCurrentAccount(accounts[0]);
				// getAllTransactions();
			}
	
			console.log(accounts);	
		} catch (error) {
			console.error(error);
			throw new Error('No ethereum object.');
		}
		
	}

	const connectWallet = async () => {
		try {
			performWalletCheck();

			const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.error(error);
			throw new Error('No ethereum object.');
		}
	}

	const sendTransaction = async () => {
		try {
			performWalletCheck();

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
		} catch (error) {
			console.error(error);

			throw new Error(error);
		}
	}

	useEffect(() => {
		checkIfWalletIsConnected();
	}, []);

	return (
		<TransactionContext.Provider value={{ connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction }}>
			{children}
		</TransactionContext.Provider>
	)
}