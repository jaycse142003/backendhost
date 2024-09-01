const express = require("express");
const mongoose = require("mongoose");
const User = require("./model");
const cors = require("cors");
const bcrypt = require("bcrypt");
const http = require("http");
const app = express();
const jwt = require("jsonwebtoken");
const Message = require("./message");
const socket = require("socket.io");
app.use(express.json());
app.use(cors({ origin: "*" }));
app.get("/", (req, res) => {
  console.log(res.body);
  res.json(res.body);
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.findOne({ username });
    if (user) {
      return res.json({ msg: "Username Already Found", status: false });
    } else {
      const em = await User.findOne({ email });
      if (em) {
        return res.json({ msg: "Email Already Found", status: false });
      } else {
        const hashedpassword = await bcrypt.hash(password, 10);
        await User.create({
          username,
          email,
          password: hashedpassword,
        });
        return res.json({ msg: "User Successfully Registered", status: true });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user) {
    const isPass = await bcrypt.compare(password, user.password);
    if (isPass) {
      const jwtToken = jwt.sign({ username: username }, "pro_stark_owner");
      return res.json({ jwtToken, userId: user._id, status: true });
    } else {
      return res.json({ msg: "Password is Not Match", status: false });
    }
  } else {
    return res.json({ msg: "Username is Incoreect", status: false });
  }
});
app.get("/currentUser/:currentId/", async (req, res) => {
  const { currentId } = req.params;
  const user = await User.findOne({ _id: currentId });
  const { username, email } = user;
  res.json({ username, email });
});
app.get("/allUser/:currentId/", async (req, res) => {
  const { currentId } = req.params;
  const user = await User.find({ _id: { $ne: currentId } });
  const modifiedList = user.map((eachItem) => ({
    id: eachItem._id,
    username: eachItem.username,
    email: eachItem.email,
  }));
  res.json(modifiedList);
});

app.post("/addMessage", async (req, res) => {
  const { from, to, message } = req.body;
  const data = await Message.create({
    message: { text: message },
    users: [from, to],
    sender: from,
  });
  if (data) {
    return res.json({ msg: "Message added sucessfully" });
  } else {
    return res.json({ msg: "Message not added" });
  }
});
app.post("/getAllMessage", async (req, res) => {
  const { from, to } = req.body;
  const messages = await Message.find({ users: { $all: [from, to] } }).sort({
    updateAt: 1,
  });
  const responseMessage = messages.map((message) => ({
    fromSender: message.sender.toString() === from,
    message: message.message,
  }));
  res.json(responseMessage);
});
mongoose
  .connect(
    "mongodb+srv://jaycse142003:jaya2003@profile.5udko.mongodb.net/UserList?retryWrites=true&w=majority&appName=Profile"
  )
  .then(() => {
    console.log("Database connnected");
  })
  .catch(() => {
    console.log("Error on connnecting");
  });

const server = http.createServer(app);

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});
global.onlineUsers = new Map();

io.on("connect", (socket) => {
  socket.on("add-online", (user_id) => {
    global.Chatsocket = socket;
    onlineUsers.set(user_id, socket.id);
    console.log(onlineUsers);
  });
  socket.on("send-msg", (data) => {
    const sendUserInOnlineSocket = onlineUsers.get(data.to);
    if (sendUserInOnlineSocket) {
      socket.to(sendUserInOnlineSocket).emit("receive-msg", data.message);
    }
  });
});

server.listen(process.env.X_ZOHO_CATALYST_LISTEN_PORT || 3001, () => {
  console.log("Server Starting...");
});
