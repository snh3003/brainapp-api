const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const postgres = require('knex')({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'snh3003',
    database : 'smart'
  }
});

postgres.select('*').from('users').then(data => console.log(data));

app.get('/', (req, res) => {
	res.send(database.users);
})

// signin route 

app.post('/signin', (req, res) => {
	postgres.select('email','hash').from('login')
	.where('email', '=', req.body.email)
	.then(data => {
		const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
		if(isValid){
			return postgres.select('*').from('users')
				.where('email', '=', req.body.email)
				.then(user => {
					res.json(user[0])
				})
				.catch(err => err.status(400).json('Unable to get the user'));
		}else{
			res.status(400).json('Wrong credentials');
		}
	})
	.catch(err => res.status(400).json('Wrong credentials'));

})

//register route

app.post('/register', (req, res) => {
	const { email, name, password} = req.body;
	const hash = bcrypt.hashSync(password);
	postgres.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			postgres('users')
				.returning('*')
				.insert({
					email: loginEmail[0],
					name: name,
					joined: new Date()
				})
				.then(user => {					
					res.json(user[0]);
				})
			})
			.then(trx.commit)
			.catch(trx.rollback)
	})
	.catch(err => res.status(400).json('Unable to join'));
	
})

app.listen(process.env.PORT || 3003, () => {
	console.log(`App is running ${process.env.port}`);
})

// profile route
app.get('/profile/:id', (req, res) => {
	const { id } = req.params;
	
	postgres.select('*').where({
		id: id
	})
	.from('users')
	.then(user => {
		if(user.length){
			console.log(user[0]);
			res.json(user[0]);	
		}else{
			res.status(400).json('error getting user');
		}
	})
	.catch(err => res.status(400).json('error getting user'));
	// if(!found){
	// 	res.status(400).json("not found"); 
	// }
})

// PUT route

app.put('/image', (req, res) => {
	const { id } = req.body;
	postgres('users')
	.where('id', '=', id)
	.increment('entries',1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0])
	})
	.catch(err => res.status(400).json('Unable to get count or entries'));
})



// Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });

/* 

ENDPOINTS

/ --> res = this is working
/signin --> POST( creates a req), respond with success/failure
/register --> POST( creates a req), respond with user
/profile/:userId --> GET(receives a res) = user
/image --> PUT( updates a req) --> userCount

*/