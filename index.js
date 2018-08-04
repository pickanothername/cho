const Discord = require('discord.js');
const client = new Discord.Client();

const PythonShell = require('python-shell');

const dnify = require('./dnify.js');

function print_help(msg) {
	msg.channel.send({
		embed: {
			fields: [
				{
					name: '!dni [ots|nts] text',
					value: 'Print text in D\'ni characters using OTS (default) or NTS format.'
				},
				{
					name: '!dni time',
					value: 'Shows current D\'ni time.'
				},
				{
					name: '!dni translate [ots|nts] text',
					value: 'Translates D\'ni text to english using OTS (default) or NTS format.'
				}
			]
		}
	});
}

function python(script, args, cb) {
	PythonShell.run(script, {
		mode: 'text',
		pythonPath: script == 'dnitime.py' ? '/usr/bin/python2' : '/usr/bin/python3',
		pythonOptions: ['-u'],
		scriptPath: 'DniTools',
		args: args
	}, cb);
}

function getArgType(args) {
	switch(args[0]) {
		case 'nts':
			args.shift(1);
			return 'nts';
		case 'ots':
			args.shift(1);
			return 'ots';
		case 'time':
			return 'time';
		case 'translate':
			args.shift(1);
			return 'translate';
		default:
			return 'ots';
	}
}

function translate(msg, args) {
	if(args.length == 1) {
		print_help(msg);
		return;
	}

	var ots = getArgType(args) == 'ots';
	var text = args.join(' ');
	args = ots ? ['-o', text] : [text];

	console.log(`Translated "${text}" (${ots ? 'OTS' : 'NTS'}) for ${msg.author.username}`);
	python('dnitransl.py', args, (err, res) => {
		if(err) throw err;

		// Print second line only
		if(res.length > 1) res.shift(1);
		msg.channel.send(res);
	});
}

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}`);

	let starry_expanse = client.guilds.find('id', '434645974346891267');
	if(!starry_expanse) {
		console.log('Starry Expanse guild not found ! :(');
	}
});

client.on('error', err => {
	console.log('Connection error.');
});

client.on('message', msg => {
	try {
		if(msg.content.indexOf('!dni') == 0) {
			let args = msg.content.split(' ');

			if(args.length == 1) {
				print_help(msg);
			} else {
				// Remove "!dni " from args
				args.shift(1);

				switch(getArgType(args)) {
					case 'nts':
						var text = dnify.NTStoDnifont(args.join(' '));
						dnify.replaceMsg(msg, text);
						break;
					case 'ots':
						var text = dnify.OTStoDnifont(args.join(' '));
						dnify.replaceMsg(msg, text);
						break;
					case 'time':
						console.log(`Printed D'ni time for ${msg.author.username}`);
						python('dnitime.py', null, (err, res) => {
							if(err) throw err;
							msg.channel.send(res);
						});
						break;
					case 'translate':
						translate(msg, args);
						break;
					default:
						// Never reached
				}
			}
		}
	} catch(err) {
		msg.channel.send('Sorry, something unexpected happened.');
		console.error(err);
	}
});

client.login(require('./config.json').token);

