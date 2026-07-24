const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.resolveSrv('_mongodb._tcp.cluster0.qxwx7li.mongodb.net', (err, addresses) => {
  if (err) console.error("DNS SRV Error:", err);
  else console.log("Addresses:", addresses);
});
