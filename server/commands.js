import dotenv from "dotenv";
dotenv.config();

import { InstallGlobalCommands } from "./utils.js"; // Import function for installing commands

// Function to create command choices (if needed)
function createCommandChoices() {
  return [
    { name: "Rock", value: "rock" },
    { name: "Paper", value: "paper" },
    { name: "Scissors", value: "scissors" },
  ];
}

// Define commands
const TEST_COMMAND = {
  name: "test",
  description: "Basic command",
  type: 1, // CHAT_INPUT
};

const CONNECT_COMMAND = {
  name: "connect",
  description: "Connect to a wallet",
  type: 1,
};

const SEND_COMMAND = {
  name: "send",
  description: "Pay a specified amount",
  type: 1, // CHAT_INPUT
  options: [
    {
      type: 3, // STRING
      name: "amount",
      description: "Amount to pay",
      required: true,
    },
    {
      type: 3, // STRING
      name: "to_address",
      description: "Address to pay to",
      required: true,
    },
  ],
};

const CHECK_COMMAND = {
  name: "check",
  description: "Check the balance of a wallet",
  type: 1,
};

const FAUCET_COMMAND = {
  name: "faucet",
  description: "Get some test tokens",
  type: 1,
};
// 生成选项数组
const generateOptions = (numOptions) => {
  const options = [];
  // Add topic
  options.push({
    type: 3, // STRING
    name: "topic",
    description: "Topic of the vote",
    required: true,
  });
  const requiredOptions = 2;
  for (let i = 1; i <= requiredOptions; i++) {
    options.push({
      type: 3, // STRING
      name: `option${i}`,
      description: `Option ${i}`,
      required: true,
    });
  }
  for (let i = requiredOptions + 1; i <= numOptions; i++) {
    options.push({
      type: 3, // STRING
      name: `option${i}`,
      description: `Option ${i}`,
      required: false,
    });
  }
  return options;
};

// 生成 10 个选项
const numOptions = 10;
const optionsArray = generateOptions(numOptions);

// 定义 VOTE_COMMAND 对象
const CREATE_VOTE_COMMAND = {
  name: "createvote",
  description: "Create vote session",
  type: 1, // CHAT_INPUT
  options: optionsArray,
};

const VOTE_COMMAND = {
  name: "vote",
  description: "Vote for a candidate",
  type: 1,
};

const TALLY_COMMAND = {
  name: "tally",
  description: "Tally for a vote session",
  type: 1,
};

const RESULT_COMMAND = {
  name: "result",
  description: "Result of a vote session",
  type: 1,
};

const SENDER_COMMAND = {
  name: "sender",
  description: "Get the receipt of a transaction",
  type: 1,
};

const RECEIVER_COMMAND = {
  name: "receiver",
  description: "Get the receipt of a transaction",
  type: 1,
};

// Update command list
const ALL_COMMANDS = [
  TEST_COMMAND,
  CONNECT_COMMAND,
  SEND_COMMAND,
  CHECK_COMMAND,
  FAUCET_COMMAND,
  CREATE_VOTE_COMMAND,
  VOTE_COMMAND,
  TALLY_COMMAND,
  RESULT_COMMAND,
  SENDER_COMMAND,
  RECEIVER_COMMAND,
];

// Install commands
InstallGlobalCommands(process.env.VITE_APP_ID, ALL_COMMANDS);
