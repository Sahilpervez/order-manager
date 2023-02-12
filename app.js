const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const Order = require('./models/order');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const userRoutes = require('./routes/user');

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/order-manager');

const db = mongoose.connection;
db.on("error", console.error.bind(console,"connection error:"));
db.once("open", () => {
    console.log("Database Connected");
})

const port = 3000;
const app = express();

app.engine('ejs',ejsMate);
app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'));

app.use(session({secret: 'secret'}));
app.use(require('flash')());
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname,'public')));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
app.use(flash());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use('/', userRoutes);

app.get('/', (req, res) => {
    // res.send("HEllo!")
    res.render('landingPage');
})

app.get('/fake', async(req, res) => {
    const user = new User({username:'tush'});
    const newUser = await User.register(user, 'hello');
    res.send(newUser);
})

app.get('/makeorder', async (req,res) => {
    const newOrder = new Order({
    CustomerName: "Tamrakarakjsbvk",
    CustomerAddr: "Satnavsdv",
    Items: [{ProductName: "Alsdvoogobhi", Qty: 5, isComplete:false},{ProductName: "tavsdvmatar", Qty: 10, isComplete:false},{ProductName: "cholvsdva", Qty:4, isComplete:false}],
    Status: 1,
    });
    await newOrder.save();
    res.send(newOrder);
})

app.get('/owner', async (req, res) => {
    const orders = await Order.find({});
    res.render('owner/owner', {orders});
})


app.get('/owner/new', async(req, res) => {
    res.render('owner/neworder');
})

//waiting for form
app.post('/owner/neworder', async(req,res) => {
    req.body.Status = 1;
    res.redirect('owner');
})

app.post('/owner/ordernew', async(req,res) => {
    res.send(req.body);
    req.body.Status = 1;
})

app.get('/worker', async (req,res) => {
    const orders = await Order.find({})
    res.render('worker/worker', {orders});
})

app.post('/worker', async(req, res) => {
    const order = await Order.findById(req.body.orderId);
    for(let prodId of req.body.productsId)
    {
        console.log(prodId);
        order.update({'Items._id':prodId}, {'$set': {
            'Items.$.isComplete': true
        }})
        // order.update({$pull:{"PendingItems":{"_id":prodId}}})
    }
    console.log(order)
    res.redirect('/worker');
})

app.get('/manager', async(req, res) => {
    const orders = await Order.find({});
    res.render('manager/manager', {orders});
})

app.post('/manager', async(req, res) => {
    // res.send(req.body);
    if(req.body.isAssigned === 'yes')
    {
        const assignedOrder = await Order.findById(req.body.orderId);
        assignedOrder.isAssigned = true;
        assignedOrder.Status = 2;
        await assignedOrder.save();
        // res.send(assignedOrder);
    }
    res.redirect('/manager');
})

app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})
