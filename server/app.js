import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import { InteractionType, InteractionResponseType, MessageComponentTypes } from "discord-interactions";
import { VerifyDiscordRequest, getRandomEmoji, sendFaucetToken } from "./utils.js";
import subscribersRouter from "./routes/subscribers.js";
import userlink from "./models/userlink.js";
import userlinksRouter from "./routes/userlinks.js";
import sendlink from "./models/sendlink.js";
import createlink from "./models/createlink.js";
import votelink from "./models/votelink.js";
import tallylink from "./models/tallylink.js";
import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  EmbedBuilder,
} from "discord.js";
import { NETWORKS } from "./network.js";
import { Wallet } from "../src/wallets/near.js";

const app = express();
const PORT = process.env.VITE_PORT || 3001;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildIntegrations,
  ],
});

const sendLinkChangeStream = sendlink.watch([{ $match: { operationType: "update" } }]);
sendLinkChangeStream.on("change", async (change) => {
  if (change.ns.coll === "sendlinks" && change.operationType === "update") {
    const id = change.documentKey._id;
    const sendLink = await sendlink.findById(id);
    const senderID = sendLink.user;
    const sender = await client.users.fetch(senderID);
    let userLink = await userlink.findOne({ address: sendLink.to_address }).sort({ generateTIME: -1 });

    // Loop to find the most recent valid address
    while (userLink && userLink.address === "0x") {
      userLink = await userlink
        .findOne({
          address: sendLink.to_address,
          generateTIME: { $lt: userLink.generateTIME }, // Find the previous record
        })
        .sort({ generateTIME: -1 });
    }
    let explorerLink;
    for (let n in NETWORKS) {
      if (NETWORKS[n].name === sendLink.network) {
        explorerLink = `${NETWORKS[n].explorer}/txn/${sendLink.transactionHash}?network=testnet`;
      }
    }
    if (userLink !== null) {
      const receiver = await client.users.fetch(userLink.user);
      await receiver.send(
        `You received ${sendLink.amount} NEAR!\nCheck the transaction at [Explorer](${explorerLink}) 🔎`,
      );
    }

    await sender.send(
      `You sent ${sendLink.amount} NEAR to ${sendLink.to_address}!\nCheck the transaction at [Explorer](${explorerLink}) 🔎`,
    );
  }
});

client.login(process.env.VITE_DISCORD_TOKEN);

app.use(
  express.json({
    verify: VerifyDiscordRequest(process.env.VITE_PUBLIC_KEY),
  }),
);

mongoose
  .connect(process.env.VITE_DATABASE_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

app.use("/subscribers", subscribersRouter);
app.use("/userlinks", userlinksRouter);

app.get("/", (req, res) => res.send("Express on Vercel"));

app.post("/interactions", async (req, res) => {
  const { type, data, member, user } = req.body;

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name, options, custom_id } = data;
    const userId = member?.user?.id || user?.id;

    if (name === "test") {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "hello world " + getRandomEmoji(),
          flags: 64,
        },
      });
    }
 
    if (name === "check") {
      let userLink = await userlink.findOne({ user: userId }).sort({ generateTIME: -1 });

      // Loop to find the most recent valid address
      while (userLink && userLink.address === "0x") {
        userLink = await userlink
          .findOne({
            user: userId,
            generateTIME: { $lt: userLink.generateTIME }, // Find the previous record
          })
          .sort({ generateTIME: -1 });
      }

      if (!userLink || userLink.address === "0x") {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `No address connected.`, flags: 64 },
        });
      } else {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `Your address is ${userLink.address}`,
            flags: 64,
          },
        });
      }
    }

    if (name === "faucet") {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // content: `Sent 0.001 NEAR to `,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("Testnet").setLabel("NEAR Testnet").setStyle(ButtonStyle.Primary),
            ),
          ],
          flags: 64,
        },
      });
    }
  
    if (type === InteractionType.APPLICATION_COMMAND || type === InteractionType.MESSAGE_COMPONENT) {
      const { name, options, custom_id } = data;
      const userId = member?.user?.id || user?.id;

      let page = 1;

      if (type === InteractionType.MESSAGE_COMPONENT) {
        // Extract information from the custom ID
        const [action, commandName, actionType, pageNumber] = custom_id.split("_");
        name = commandName;
        page = parseInt(pageNumber, 10);
        page = actionType === "next" ? page + 1 : page - 1;
      } else if (options && options.length) {
        page = parseInt(options[0].value, 10) || 1;
      }

      if (name === "sender" || name === "receiver") {
        // Find the most recent valid address
        let userLink = await userlink.findOne({ user: userId }).sort({ generateTIME: -1 });

        while (userLink && userLink.address === "0x") {
          userLink = await userlink
            .findOne({
              user: userId,
              generateTIME: { $lt: userLink.generateTIME },
            })
            .sort({ generateTIME: -1 });
        }

        if (!userLink || userLink.address === "0x") {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "No address connected.", flags: 64 },
          });
        }

        // Pagination setup
        const recordsPerPage = 10;
        const skip = (page - 1) * recordsPerPage;

        // Query based on the command type
        const query =
          name === "sender"
            ? { user: userId, transactionHash: { $ne: null } }
            : {
                to_address: userLink.address,
                transactionHash: { $ne: null },
              };

        // Fetch transactions (including one extra to check for next page)
        const transactions = await sendlink
          .find(query)
          .sort({ generateTIME: -1 })
          .skip(skip)
          .limit(recordsPerPage + 1); // Fetch one extra record to check if the next page exists

        if (transactions.length === 0) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: "No transactions found.", flags: 64 },
          });
        }

        // Format the transactions into an embed
        const embed = new EmbedBuilder()
          .setTitle(`Transactions (Page ${page})`)
          .setColor(0x00ae86)
          .addFields(
            await Promise.all(
              transactions.slice(0, recordsPerPage).map(async (trx) => {
                console.log("Transaction user ID:", trx.user);

                // 查找用户的最近有效地址
                let userLink = await userlink
                  .findOne({ user: trx.user }) // 根据 `trx.user` 查找 userLink
                  .sort({ generateTIME: -1 });

                // 如果第一个查到的记录地址无效，继续寻找上一个有效的地址
                while (userLink && userLink.address === "0x") {
                  userLink = await userlink
                    .findOne({
                      user: trx.user,
                      generateTIME: {
                        $lt: userLink.generateTIME,
                      },
                    })
                    .sort({ generateTIME: -1 });
                }

                // 如果找不到有效地址，返回一个默认值或错误提示
                const senderAddress = userLink.address;
                const formattedTime = new Date(trx.generateTIME).toLocaleString("en-US", {
                  timeZone: "America/New_York", // ET timezone
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                return {
                  name: `Amount: ${trx.amount}`,
                  value:
                    name === "sender"
                      ? `**Receiver Address:** ${trx.to_address}\n**Time:** ${formattedTime} (Eastern Time)\n[explorer🔗](https://explorer.aptoslabs.com/txn/${trx.transactionHash}?network=testnet)`
                      : `**Sender Address:** ${senderAddress}\n**Time:** ${formattedTime} (Eastern Time)\n[explorer🔗](https://explorer.aptoslabs.com/txn/${trx.transactionHash}?network=testnet)`,
                  inline: false,
                };
              }),
            ),
          );

        // Prepare response with pagination buttons
        const response = {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [embed],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(`paginate_${name}_prev_${page}`)
                  .setLabel("Previous Page")
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(page === 1),
              ),
            ],
            flags: 64,
          },
        };

        // If more records are available, show the next page button
        if (transactions.length > recordsPerPage) {
          response.data.components[0].addComponents(
            new ButtonBuilder()
              .setCustomId(`paginate_${name}_next_${page}`)
              .setLabel("Next Page")
              .setStyle(ButtonStyle.Primary),
          );
        }

        return res.send(response);
      }
    }

    if (name === "connect") {
      const sessionId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date();
      const newUserLink = new userlink({
        user: userId,
        autolink: sessionId,
        generateTIME: timestamp,
      });

      try {
        await newUserLink.save();

        const response = {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Connect your wallet:",
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setLabel("Connect 🔁")
                  .setStyle(ButtonStyle.Link)
                  .setURL(`http://localhost:3000/connect/${sessionId}`),
              ),
            ],
            flags: 64,
          },
        };

        res.send(response);
      } catch (error) {
        console.error(error);
        res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "Failed to save user link.", flags: 64 },
        });
      }
    }

    if (name === "createvote") {
      const sessionId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date();
      const channelID = data.id;

      // 收集所有选项值并存储为数组
      const optionArray = [];
      const topic = options.find((opt) => opt.name === `topic`)?.value;
      for (let i = 1; i <= 10; i++) {
        // 假设最多有 10 个选项
        const option = options.find((opt) => opt.name === `option${i}`)?.value;

        if (option !== undefined) {
          optionArray.push(option);
        }
      }

      const newcreateLink = new createlink({
        user: userId,
        createlink: sessionId,
        generateTIME: timestamp,
        option: optionArray, // 将选项存储为数组
        channelId: channelID,
        topic: topic,
      });

      await newcreateLink.save();

      const buttons = [
        new ButtonBuilder()
          .setLabel("Connect 🔁")
          .setStyle(ButtonStyle.Link)
          .setURL(`http://localhost:3000/create/${sessionId}`),
      ];

      // 将按钮分配到 ActionRow 中
      const actionRow = new ActionRowBuilder().addComponents(buttons);

      // 返回响应
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Connect wallet to create:`,
          components: [actionRow],
          flags: 64,
        },
      });
    }

    if (name === "vote") {
      const validVoteLists = await createlink.find({
        topic: { $ne: null },
        // transactionHash: { $ne: null },
        // network: { $ne: null },
        // voteId: { $ne: null },
        finished: { $ne: true },
      });

      const options = [];
      for (let i = 0; i < validVoteLists.length; i++) {
        options.push({
          label: validVoteLists[i].topic,
          value: `votelist_${validVoteLists[i]._id}`,
          description: `created by <@${userId}>`,
        });
      }

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Choose a topic you want to vote for:",
          // Selects are inside of action rows
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.STRING_SELECT,
                  // Value for your app to identify the select menu interactions
                  custom_id: "vote_list",
                  // Select options - see https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure
                  options: options,
                },
              ],
            },
          ],
          flags: 64,
        },
      });
    }

    if (name === "tally") {
      const validVoteLists = await createlink.find({
        user: userId,
        topic: { $ne: null },
        // transactionHash: { $ne: null },
        // network: { $ne: null },
        // voteId: { $ne: null },
        finished: { $ne: true },
      });
      const options = [];
      if (validVoteLists.length === 0) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "No votes can be tallied by you.",
            flags: 64,
          },
        });
      }
      for (let i = 0; i < validVoteLists.length; i++) {
        options.push({
          label: validVoteLists[i].topic,
          value: `tallylist_${validVoteLists[i]._id}`,
          description: `created by <@${userId}>`,
        });
      }
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Choose a topic you want to declare winner:",
          // Selects are inside of action rows
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.STRING_SELECT,
                  // Value for your app to identify the select menu interactions
                  custom_id: "tally_list",
                  // Select options - see https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure
                  options: options,
                },
              ],
            },
          ],
          flags: 64,
        },
      });
    }

    if (name === "result") {
      const validVoteLists = await createlink.find({
        // finished: true,
        topic: { $ne: null },
      });

      const options = [];
      for (let i = 0; i < validVoteLists.length; i++) {
        options.push({
          label: validVoteLists[i].topic,
          value: `resultlist_${validVoteLists[i]._id}`,
          description: `created by <@${userId}>`,
        });
      }
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Choose a topic you want to check the voting result:",
          // Selects are inside of action rows
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.STRING_SELECT,
                  // Value for your app to identify the select menu interactions
                  custom_id: "result_list",
                  // Select options - see https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure
                  options: options,
                },
              ],
            },
          ],
          flags: 64,
        },
      });
    }

    if (name === "send") {
      const amount = options.find((option) => option.name === "amount")?.value;
      const to_address = options.find((option) => option.name === "to_address")?.value;

      if (!amount || !to_address) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Please specify both amount and recipient.",
            flags: 64,
          },
        });
      }

      try {
        // Handle if to_address is a user mention or an address
        let recipientAddress = to_address;
        if (to_address.startsWith("<@")) {
          // Extract user ID from the mention
          const userId = to_address.replace(/[<@!>]/g, "");

          // Retrieve the most recent valid address for the user from the database
          let userLink = await userlink.findOne({ user: userId }).sort({ generateTIME: -1 });

          // Loop to find the most recent valid address
          while (userLink && userLink.address === "0x") {
            userLink = await userlink
              .findOne({
                user: userId,
                generateTIME: { $lt: userLink.generateTIME }, // Find the previous record
              })
              .sort({ generateTIME: -1 });
          }

          if (!userLink || userLink.address === "0x") {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: "No valid address connected for the user.",
                flags: 64,
              },
            });
          }
          recipientAddress = userLink.address;
        } else if (to_address.startsWith("0x")) {
          // Handle the case where to_address is a valid address
          recipientAddress = to_address;
        } else {
          // Handle invalid address format
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: "Invalid address or user mention.",
              flags: 64,
            },
          });
        }

        // Create a new send link
        const sessionId = Math.random().toString(36).substring(2, 15);
        const timestamp = new Date();

        const newSendLink = new sendlink({
          user: userId, // Use the correct user ID if available
          sendautolink: sessionId,
          generateTIME: timestamp,
          amount: amount,
          to_address: recipientAddress, // Use the resolved recipient address
        });

        await newSendLink.save(); // Save the new send link to the database

        const response = {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `${amount} NEAR to ${recipientAddress}`,
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setLabel("Send 💸")
                  .setStyle(ButtonStyle.Link)
                  .setURL(`http://localhost:3000/send/${sessionId}`),
              ),
            ],
            flags: 64,
          },
        };

        res.send(response);
      } catch (error) {
        console.error(error);
        res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "Failed to save send link.", flags: 64 },
        });
      }
    }
  }
  if (type === InteractionType.MESSAGE_COMPONENT) {
    const { name, options, custom_id } = data;
    // custom_id set in payload when sending message component
    const userId = user?.id || member?.user?.id;

    if (custom_id === "Testnet") {
      return await sendFaucetToken(res, userId, "testnet");
    }
    if (custom_id === "vote_list") {
      // Get selected option from payload
      const selectedOption = data.values[0];

      const voteId = selectedOption.replace("votelist_", "");

      console.log(voteId);

      const vote = await createlink.findById(voteId);

      const options = [];
      for (let i = 0; i < vote.option.length; i++) {
        options.push({
          label: vote.option[i],
          value: `option_${i}`,
        });
      }

      const userId = req.body.user.id || req.body.member.user.id;

      // Send results
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `<@${userId}> selected ${selectedOption}`,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.STRING_SELECT,
                  // Value for your app to identify the select menu interactions
                  custom_id: `vote_option_${vote._id}`,
                  // Select options - see https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure
                  options: options,
                },
              ],
            },
          ],
          flags: 64,
        },
      });
    }
    if (custom_id.startsWith("vote_option_")) {
      const voteId = custom_id.replace("vote_option_", "");

      const selectedOption = data.values[0];
      const optionId = selectedOption.replace("option_", "");

      const vote = await createlink.findById(voteId);

      const timestamp = new Date();
      const sessionId = Math.random().toString(36).substring(2, 15);
      // TODO: get voteID from vote
      const onchainVoteId = vote.voteId;
      console.log(onchainVoteId);
      const newVoteLink = new votelink({
        user: userId,
        votelink: sessionId,
        generateTIME: timestamp,
        choice: optionId,
        voteId: voteId,
      });
      await newVoteLink.save();
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Connect wallet to vote:",
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("Vote ✅")
                .setStyle(ButtonStyle.Link)
                .setURL(`http://localhost:3000/vote/${sessionId}`),
            ),
          ],
          flags: 64,
        },
      });
    }
    if (custom_id === "tally_list") {
      // Get selected option from payload
      const selectedOption = data.values[0];
      const voteId = selectedOption.replace("tallylist_", "");
      const vote = await createlink.findById(voteId);
      const timestamp = new Date();
      const onchainVoteId = vote.voteId;
      const sessionId = Math.random().toString(36).substring(2, 15);
      const newTallyLink = new tallylink({
        user: userId,
        tallylink: sessionId,
        generateTIME: timestamp,
        voteId: onchainVoteId,
      });
      await newTallyLink.save();

      // Send results
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Connect wallet to declare winner:`,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("Tally Vote 💸")
                .setStyle(ButtonStyle.Link)
                .setURL(`http://localhost:3000/tally/${sessionId}`),
            ),
          ],
          flags: 64,
        },
      });
    }
    if (custom_id === "result_list") {
      const selectedOption = data.values[0];
      const voteId = selectedOption.replace("resultlist_", "");
      const vote = await createlink.findById(voteId);
      const onchainVoteId = voteId;
      
      // Initialize NEAR wallet
      const wallet = new Wallet({
        networkId: 'testnet',
        createAccessKeyFor: vote.contractId 
      });
  
      const accountId = await getAccountFromUserId(userId);
      console.log(accountId);
  
      // View the winner using NEAR wallet
      const result = await wallet.viewMethod({
        contractId: vote.contractId,
        method: 'get_vote_winner',
        args: { vote_id: onchainVoteId }
      });
  
      // Send results
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `The winner of the vote: ${result}`,
          flags: 64,
        },
      });
  }
  }
});

async function getAddressFromUserId(userId) {
  const userLink = await userlink.findOne({ user: userId });
  return userLink ? userLink.address : null;
}

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});

export default app;
