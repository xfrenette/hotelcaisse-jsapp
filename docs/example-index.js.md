Example of how to configure and start the application
===
const auth = new auth/Cloud('http://auth.example.com');

const config = {
	auth: auth,
	initialSources: [
		auth: new data-source/Device('authentication'),
		businessData: [
			new data-source/Device('businessData'),
			new data-source/API('http://api.example.com', auth)
		]
	],
	plugins: [
		new plugins/IntervalAuthCheck(auth)
		new plugins/autosave/Auth(data-source/Device('authentication')),
		new plugins/autosave/BusinessData(data-source/Device('authentication'))
		new plugins/autosave/NewOrdersData(data-source/API(http://api.example.com, auth))
		new plugins/autosave/Register(data-source/API(http://api.example.com, auth))
	],
};

const app = new Application(config);
app.boostrap();
app.start();
