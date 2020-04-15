const UserAgent = require('user-agents'),
	fs = require('fs'),
	performance = require('perf_hooks').performance,
	ciphers = [
        "AES128-SHA",
        "AES256-SHA"
    ].join(":");
    cloudscraper = require('cloudscraper').defaults({ ciphers:ciphers}),
	lodash = require('lodash'),
	rp = require('request-promise'),
	chalk = require('chalk'),
	jsdom = require("jsdom"),
	{ JSDOM } = jsdom,
	randomstring = require("randomstring"),
	uuidv4 = require('uuid/v4'),
	websites = require('./websites.json'),
	logger = require("./libs/logger"),
	proxies = fs.readFileSync('./proxy.txt', 'utf-8').toString().toLowerCase().split("\r\n").filter(l => l.length !== 0),
	{app, session, net} = require('electron');
let cookie_counter = 0,
	akamaiSession;
app.on('ready', () => {
	akamaiSession = session.fromPartition('akamai', {cache: false});
	var userAgent = (new UserAgent(/Chrome/, {deviceCategory: 'desktop'})).toString().replace(/\|"/g, ""),
	ua_browser = userAgent.indexOf("Chrome") > -1 ? "chrome" : userAgent.indexOf("Safari") > -1 ? "safari" : userAgent.indexOf("Firefox") > -1 ? "firefox" : "ie";
	init('footlocker', userAgent, ua_browser, undefined, undefined)
});

async function init(site, userAgent, ua_browser, proxy, abck, post_url, cookieJar){
	getmr()
	var site = (abck == null) ? websites.find(w => w.name === site) : site,
		bmak = {
			ver: site.ver,
			loc: "",
			sensor_data: 0,
			xagg: -1,
			pen: -1,
			fpValstr: "",
			psub: "-",
			lang: "-",
			prod: "-",
			wen: 0,
			den: 0,
			plen: -1,
			z1: 0,
			start_ts: get_cf_date(true),
			doact: 0,
			dmact: 0,
			me_cnt: 0,
			me_vel: 0,
			ta: 0,
			n_ck: 0,
			doe_vel: 0,
			dme_vel: 0,
			doe_cnt: 0,
			aj_type: 0,
			aj_indx: 0,
			pe_cnt: 0,
			updatet: 0,
			td: 0,
			s: 0,
			getmr: "",
			nav_perm: "",
			y: Math.floor(1e3 * Math.random()).toString(),
			z: -1,
			p: 0,
			genmouse: '',
			ua_browser: ua_browser,
		},
		formInfo = await getforminfo(site, userAgent, proxy);
	abck == null ? await switcher('minimal', bmak) : await switcher('nomouse', bmak);
	abck == null ? get_abck(site, bmak, userAgent, ua_browser, formInfo, proxy) : sensorGen(bmak, abck, ua_browser, userAgent, proxy, site, post_url, formInfo, cookieJar);
}

function get_abck(site, bmak, userAgent, ua_browser, formInfo, proxy) {
	var post_url,
		req = net.request({
			method: "GET",
			url: site.url,
			session: akamaiSession,
			useSessionCookies: true,
			hostname: site.host,
			headers: {
				'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
				'user-agent': userAgent,
				'sec-fetch-site': 'none',
				'sec-fetch-mode': 'navigate',
				'accept-encoding': 'gzip, deflate, br',
				'accept-language': 'en-US,en;q=0.9'
			}
		});
	akamaiSession.setUserAgent(userAgent);

	req.on("response", (response) => {
		response.on("error", e => reject(e));
		response.on('data', (chunk) => {
			var body = chunk.toString('utf8');
			var post_url_match = /src="\/(static|assets|api|resources|public)\/(\w+)/gm.exec(body);
			if(post_url_match == null) return;
			post_url = `${post_url_match[1]}/${post_url_match[2]}`;
		});
		response.on('end', () => {
			akamaiSession.cookies.get({}).then((cookies) => {
				var abck = cookies.find(x => x.name === "_abck").value;
				sensorGen(bmak, abck, ua_browser, userAgent, proxy, site, post_url, formInfo, cookieJar);
			}).catch((e) => logger.red(e.message));
		});
	});
	req.end();
	var cookieJar = new rp.jar();

	// var params = {
	// 	method: 'GET',
	// 	url: site.url,
	// 	headers: {
			// ...site.headers,
			// 'user-agent': userAgent,
	// 	},
	// 	proxy: proxy !== undefined ? `http://${proxy}` : null,
	// 	timeout: 2000,
	// 	html: true,
	// 	jar: cookieJar,
	// 	resolveWithFullResponse: true,
	// }

	// cloudscraper(params).then(response => {
	// 	var post_url_match = /src="\/(static|assets|api|resources|public)\/(\w+)/gm.exec(response.body),
	// 		post_url = `${post_url_match[1]}/${post_url_match[2]}`,
	// 		abck = response.headers['set-cookie'].toString().split('_abck=')[1].split("; Domain")[0];
		// sensorGen(bmak, abck, ua_browser, userAgent, proxy, site, post_url, formInfo, cookieJar);
	// }).catch(e => {
	// 	logger.red(e.message == "Error: ESOCKETTIMEDOUT" ? `[GET] Proxy Banned` : `[GET] ${e.message}`);
	// })
}

async function sensorGen(bmak, abck, ua_browser, userAgent, proxy, site, post_url, formInfo, cookieJar) {
	to(bmak);
	var sensor_data =
		bmak.ver +
		"-1,2,-94,-100," +
		gd(ua_browser, userAgent, bmak) +
		"-1,2,-94,-101," +
		"do_en,dm_en,t_en" +
		"-1,2,-94,-105," +
		formInfo +
		"-1,2,-94,-102," +
		formInfo +
		"-1,2,-94,-108," +
		//bmak.kact
		"-1,2,-94,-110," +
		bmak.genmouse + //OR EMPTY MOUSE => "0,1," + mm + ',' + kk + ',' + ll + ';' +
		"-1,2,-94,-117," +
		//bmak.tact
		"-1,2,-94,-111," +
		// cdoa(bmak) +
		"-1,2,-94,-109," +
		// dmact(bmak) +
		// cdma(bmak) +
		"-1,2,-94,-114," +
		//bmak.pact
		"-1,2,-94,-103," +
		//bmak.vcact
		"-1,2,-94,-112," +
		site.url +
		"-1,2,-94,-115," +
		[1, bmak.me_vel + 32, 32, 0, 0, 0, 0, bmak.updatet, 0, bmak.start_ts, bmak.td, parseInt((parseInt(bmak.start_ts / (2016 * 2016))) / 23), 0, bmak.me_cnt, parseInt(parseInt((parseInt(bmak.start_ts / (2016 * 2016))) / 23) / 6), bmak.pe_cnt, 0, bmak.s, bmak.ta, 0, abck, ab(abck), bmak.y, bmak.z, 30261693].join(',') + //needs to be improved
		"-1,2,-94,-106," +
		bmak.aj_type + "," + bmak.aj_indx +
		"-1,2,-94,-119," +
		bmak.getmr +
		"-1,2,-94,-122," +
		sed() +
		"-1,2,-94,-123," +
		//h function (undefined)
		"-1,2,-94,-124," +
		//g function (undefined)
		"-1,2,-94,-126," +
		"-1,2,-94,-127," +
		bmak.nav_perm;

	var w = ab(sensor_data);

	sensor_data =
		sensor_data +
		"-1,2,-94,-70," +
		bmak.fpValstr +
		"-1,2,-94,-80," +
		bmak.p +
		"-1,2,-94,-116," +
		to(bmak) +
		"-1,2,-94,-118," +
		w +
		"-1,2,-94,-121,";
	var sensor = gen_key(sensor_data);
	//logger.yellow(sensor);
	return validator(sensor, bmak, formInfo, userAgent, ua_browser, proxy, site, post_url, cookieJar)
}

function validator(sensor, bmak, formInfo, userAgent, ua_browser, proxy, site, post_url, cookieJar) {

	var options = {
		'method': 'POST',
		'url': `https://${site.host}/${post_url}`, 
		'session': akamaiSession,
		'useSessionCookies': true,
		'hostname': site.host,
		headers: {
			'sec-fetch-dest': 'empty',
			'user-agent': userAgent,
			'content-type': 'text/plain;charset=UTF-8',
			'accept': '*/*',
			'origin': `https://${site.host}`,
			'sec-fetch-site': 'same-origin',
			'sec-fetch-mode': 'cors',
			'referer': site.url,
			'accept-encoding': 'gzip, deflate, br',
			'accept-language': 'en-US,en;q=0.9,fr;q=0.8,de;q=0.7'
		},
	  };
	  
	  var req = net.request(options, function (res) {
		var chunks = [];
	  
		res.on("data", function (chunk) {
		  chunks.push(chunk);
		});
	  
		res.on("end", function (chunk) {
			akamaiSession.cookies.get({}).then((cookies) => {
				var abck = cookies.find(x => x.name === "_abck").value;
				var verify = verify_abck(abck, site, true);
				verify.success ? logger.green(JSON.stringify(verify)) : logger.red(JSON.stringify(verify));
				//app.exit(0)
				init(site, userAgent, ua_browser, proxy, abck, post_url, cookieJar);
			}).catch((e) => logger.red(e.message));
		});
	  
		res.on("error", function (error) {
		  console.error(error);
		});
	  });
	  
	var postData = `{\"sensor_data\":\"${sensor}\"}`;

	req.write(postData);
	  
	req.end();

	// var params = {
	// 	method: 'POST',
	// 	url: `https://${site.host}/${post_url}`,
	// 	headers: {
			// 'Accept': '*/*',
			// 'Accept-Encoding': 'gzip, deflate, br',
			// 'Accept-Language': 'en-US,en;q=0.9',
			// 'Content-Type': 'application/json',
			// 'dnt': '1',
			// 'Host': site.host,
			// 'User-Agent': userAgent,
			// 'Connection': 'keep-alive',
			// 'Cache-Control': 'no-cache',
	// 	},
		// body: JSON.stringify({
		// 	"sensor_data": sensor
		// }),
	// 	proxy: proxy !== undefined ? `http://${proxy}` : null,
	// 	timeout: 2000,
	// 	jar: cookieJar,
	// 	resolveWithFullResponse: true,
	// }
	// return cloudscraper(params).then(response => {
	// 	abck = response.headers['set-cookie'].toString().split("_abck=")[1].split("; Domain")[0];
	// 	logger.blue(JSON.stringify(verify_abck(abck, site)));
	// 	logger.white('')
		// init(site, userAgent, ua_browser, proxy, abck, post_url, cookieJar);
	// }).catch(e => {
	// 	logger.red(e.message == "Error: ESOCKETTIMEDOUT" ? `[POST] Proxy Banned` : `[POST] ${e.message}`)
	// });
}

function gd(ua_browser, userAgent, bmak) {
	var screen_size = screenSize(),
		a = userAgent,
		t = "" + ab(a),
		e = bmak.start_ts / 2,
		n = screen_size[0],
		o = screen_size[1],
		m = screen_size[2],
		r = screen_size[3],
		i = screen_size[4],
		c = screen_size[5],
		b = screen_size[6];
	bmak.z1 = parseInt(bmak.start_ts / (2016 * 2016));
	var d = Math.random(),
		k = parseInt((1e3 * d) / 2),
		l = d + "";
	return ((l = l.slice(0, 11) + k), get_browser(ua_browser, bmak), bc(ua_browser, bmak), bmisc(bmak), a + ",uaend," + bmak.xagg + "," + bmak.psub + "," + bmak.lang + "," + bmak.prod + "," + bmak.plen + "," + bmak.pen + "," + bmak.wen + "," + bmak.den + "," + bmak.z1 + "," + bmak.d3 + "," + n + "," + o + "," + m + "," + r + "," + i + "," + c + "," + b + "," + bd(ua_browser) + "," + t + "," + l + "," + e + ",loc:" + bmak.loc);
}

function screenSize() {
	return lodash.sample([
		['1098', '686', '1098', '686', '1098', '583', '1098'],
		['1280', '680', '1280', '720', '1280', '578', '1280'],
		['1440', '776', '1440', '900', '1440', '660', '1440'],
		['1440', '826', '1440', '900', '1440', '746', '1440'],
		['1440', '860', '1440', '900', '1440', '757', '1440'],
		['1440', '831', '1440', '900', '1440', '763', '1440'],
		['1440', '851', '1440', '900', '1420', '770', '1420'],
		['1440', '786', '1440', '900', '1440', '789', '1440'],
		['1440', '900', '1440', '900', '1440', '821', '1440'],
		['1536', '824', '1536', '864', '1536', '722', '1536'],
		['1680', '972', '1680', '1050', '1680', '939', '1680'],
		['1680', '1020', '1680', '1050', '1680', '917', '1680'],
		['1920', '1040', '1920', '1080', '1920', '937', '1920'],
		['1920', '1040', '1920', '1080', '1920', '969', '1920'],
		['1920', '1080', '1920', '1080', '1920', '1007', '1920'],
		['2560', '1400', '2560', '1440', '2560', '1327', '2576'],
		['1024', '1024', '1024', '1024', '1024', '1024', '1024'],
		['1680', '973', '1680', '1050', '1133', '862', '1680'],
		['1680', '973', '1680', '1050', '1680', '862', '1680'],
		['1024', '768', '1024', '768', '1256', '605', '1272']
	]);
}

function get_browser(ua_browser, bmak) {
	bmak.psub = productSub(ua_browser),
	bmak.lang = "en-US",
	bmak.prod = "Gecko",
	bmak.plen = pluginsLength(ua_browser);
}

function pluginsLength(browser) {
	switch (browser) {
		case "chrome":
			return 3;
		case "ie":
			return 1;
		case "opera":
			return 1;
		case "firefox":
			return 0;
		case "safari":
			return 1;
	}
}

function productSub(browser) {
	switch (browser) {
		case "chrome":
			return 20030107;
		case "ie":
			return 20030107;
		case "opera":
			return 20030107;
		case "firefox":
			return 20100101;
		case "safari":
			return 20030107;
	}
}

function touchEvent(browser) {
	switch (browser) {
		case "chrome":
			return 1;
		case "ie":
			return 0;
		case "opera":
			return 1;
		case "firefox":
			return 1;
		case "safari":
			return 0;
	}
}

function chrome(browser) {
	switch (browser) {
		case "chrome":
			return 1;
		default:
			return 0;
	}
}

function bc(ua_browser, bmak) {
	var a = 1,
		t = 1,
		e = 0,
		n = 0,
		o = 1,
		m = 1,
		r = touchEvent(ua_browser),
		i = 0,
		c = 1,
		b = 1,
		d = chrome(ua_browser),
		k = 1,
		l = 0,
		s = 1;
	bmak.xagg =
		a +
		(t << 1) +
		(e << 2) +
		(n << 3) +
		(o << 4) +
		(m << 5) +
		(r << 6) +
		(i << 7) +
		(c << 8) +
		(b << 9) +
		(d << 10) +
		(k << 11) +
		(l << 12) +
		(s << 13);
}

function bmisc(bmak) {
	bmak.pen = 0,
	bmak.wen = 0,
	bmak.den = 0;
}

function bd(browser) {
	switch (browser) {
		case "chrome":
			return [",cpen:0", "i1:0", "dm:0", "cwen:0", "non:1", "opc:0", "fc:0", "sc:0", "wrc:1", "isc:0", "vib:1", "bat:1", "x11:0", "x12:1"].join(",");
		case "ie":
			return [",cpen:0", "i1:1", "dm:1", "cwen:0", "non:1", "opc:0", "fc:0", "sc:0", "wrc:0", "isc:0", "vib:0", "bat:0", "x11:0", "x12:1"].join(",");
		case "opera":
			return [",cpen:0", "i1:0", "dm:0", "cwen:0", "non:1", "opc:1", "fc:0", "sc:0", "wrc:1", "isc:0", "vib:0", "bat:1", "x11:0", "x12:1"].join(",");
		case "firefox":
			return [",cpen:0", "i1:0", "dm:0", "cwen:0", "non:1", "opc:0", "fc:1", "sc:0", "wrc:1", "isc:1", "vib:1", "bat:0", "x11:0", "x12:1"].join(",");
		case "safari":
			return [",cpen:0", "i1:0", "dm:0", "cwen:0", "non:1", "opc:0", "fc:0", "sc:0", "wrc:1", "isc:0", "vib:0", "bat:0", "x11:0", "x12:1"].join(",");
	}
}

function pluginInfo(browser) {
	switch (browser) {
		case "chrome":
			return [",7,8"];
		case "ie":
			return [""];
		case "opera":
			return [""];
		case "firefox":
			return [",3"];
		case "safari":
			return [""];
	}
}

function webrtcKey(browser) {
	switch (browser) {
		case "chrome":
			return true;
		case "ie":
			return false;
		case "opera":
			return true;
		case "firefox":
			return true;
		case "safari":
			return true;
	}
}

function cc(a) {
	var t = a % 4;
	2 == t && (t = 3);
	var e = 42 + t;
	return String.fromCharCode(e)
}

function to(bmak) {
	var a = get_cf_date() % 1e7;
	bmak.d3 = a;
	for (var t = a, e = 0; e < 5; e++) {
		var n = parseInt(a / Math.pow(10, e)) % 10,
			o = n + 1,
			m = 'return a' + cc(n) + o + ';';
		t = new Function('a', m)(t)
	}
	return t
}

function data(ua_browser) {
	return [canvas(), canvas_2(), "dis", pluginInfo(ua_browser), true, true, true, ((new Date).getTimezoneOffset()), webrtcKey(ua_browser), 24, 24, true, false, "1"].filter(x => x !== null).join(";")
}

function sed() {
	return [0, 0, 0, 0, 1, 0, 0].join(",");
}

function canvas() {
	return lodash.sample([-1151536724, -1152944628, -1259079336, -1618588580, -1752250632, -1752591854, -1880212897, -36060876, -434613739, -509993527, -52233038, -739578230, -746822318, 1112667908, 1454252292, 1544133244, 1637755981, 59688812, 73331404, 763748173]).toString();
}

function canvas_2() {
	return lodash.sample([66351601, 1396487819]).toString();
}

function ab(a) {
	if (null == a) return -1;
	for (var t = 0, e = 0; e < a.replace(/\\\"/g, '').replace('/', '').length; e++) {
		var n = a.replace(/\\\"/g, '').replace('/', '').charCodeAt(e);
		n < 128 && (t += n);
	}

	return t;
}

function gen_key(sensor_data) {
	var hh = lodash.random(4, 50);
	var a = get_cf_date();
	var y = od("0a46G5m17Vrp4o4c", "afSbep8yjnZUjq3aL010jO15Sawj2VZfdYK8uY90uxq").slice(0, 16);
	var w = Math.floor(get_cf_date() / 36e5);
	var j = get_cf_date();
	var E = y + od(w, y) + sensor_data;
	sensor_data = E + ";" + lodash.random(0, 5) + ";" + hh + ";" + (get_cf_date() - j)
	return sensor_data;
}

function rir(a, t, e, n) {
	return a > t && a <= e && (a += n % (e - t)) > e && (a = a - e + t), a;
}

/**
 * @description Gets the date when the sensor is genned
 * @param {boolean} start
 * @returns Date
 */
function get_cf_date(start) {
	if (Date.now) {
		return (start ? new Date(Date.now()).getTime() : Date.now());
	} else {
		return (start ? new Date(+new Date()).getTime() : +new Date());
	}
}

function getFloatVal(a) {
	try {
		if (-1 != chknull(a) && !isNaN(a)) {
			var t = parseFloat(a);
			if (!isNaN(t)) return t.toFixed(2)
		}
	} catch (a) { }
	return -1
}

function chknull(a) {
	return null == a ? -1 : a
};

function od(a, t) {
	try {
		(a = a.toString()), (t = t.toString());
		var e = [];
		var n = t.length;
		if (n > 0) {
			for (var o = 0; o < a.length; o++) {
				var m = a.charCodeAt(o);
				var r = a.charAt(o);
				var i = t.charCodeAt(o % n);
				(m = rir(m, 47, 57, i)),
					m != a.charCodeAt(o) && (r = String.fromCharCode(m)),
					e.push(r);
			}
			if (e.length > 0) return e.join("");
		}
	} catch (a) { }
	return a;
}

function switcher(type, bmak){
	var add_random = lodash.random(40, 1600);
	var canvasArray = [1919619550, -1085185828, 1577591477, 1958559063, 1590583886, 803501153, 1321416369, 1332131968, -1787050453, -1476045391, -1249560680, -307900961, -897401638, 1709140274, 1475048621, -1170855828, -1829873084, -1512615331, -573415275, 1361126098, -1361238855, 40959895, -2105304209, 22178460, 1470773690, -1205632004, 949173836, 2084738809, 962317613, 1855184060, 1895730262, -1192897860, -708764388, -468451651, 1512892720, -1595694700, 1589472982, -584358640, -753875503, -970573925, 1593248957, 832443918, -2086080131, 1599414695, 1294939072, -266172782, 267125544, -117935709, -382099010, 683139923, 605378659, 531048646, 1473006948, 1896233946, 1081567925, -1337405644, 126549912, 775316417, 1564455373, -1032659979, -1394229960, 868242717, -1691668883, 985904217, 804413516, -2005170143, -1066190195, 2139001865, 149826589, 313665912, -2115346543, -883743074, 675677164, 751721323, 282043467, 599027506, 95789836, 977322217, 1515016729, 382196848, 867324092, -1372025774, -1766240076, -1166190575, 1022881729, 2039262647, 1280289523, -841711560, -729260194, 106379808, 1831935536, 349043025, -586373857, 1406533623, 1234549834, 1792446232, 197242163, 228750819, -1091322357, -1648351618, -533479225, 1190868050, -858804567, -478770949, 34712964, -880781543, 867322169, 991305586, -316899420, 1749902403, -958883221, -1474626848, -2000791231, -87268314, 155229937, 142006334, 1246607029, 1063218567, 369994210, -574654566, 233802077, -654616279, -1720288619, 248066775, -1690343480, 813579045, 318510261, -2099981713, 1916819915, 426522241, 1982873175, 259558704, -1135446035, 2123810049, 1772694758, 809855726, -644707227, 1459695271, 98083533, 1765877848, -1551103271, -1914916132, 1427706569, 171353429, 1336912234, 653579005, -1028161146, 1398744446, -547031256, -626036720, 614558751, -602697365, 1854921746, 2085005153, -1843345038, 1867726891, -573393068, -2043001444, -1466500821, -601805002, -427186192, 1532988208, -1539748643, 546785630, 81521532, 1192026764, -1757464415, -323512492, -1481594226, 107746788, -858095953, 363553961, -1759692542, 1099214035, -2087355482, -197391300, -2097876531, 2019372932, -330462884, 1802059905, 827112250, 1440380285, 467074714, 228661045, 527283370, -1107885465, 1708523220, 2121425108, 145400717, 2053165989, 1991074146, -2059670094, 911984436, -889775473, -311617566, -796487964, -905019286, -286402639, -16013481, 1129656526, -1052621218, 1681510179, -2042032971, 258753656, -249539474, 1995029405, 1868201585, -191426787, 1519756866, 1526502928, -972855174, 1853700035, 1801350837, 1934535310, 1072274748, 473072677, 286672874, 1290074182, -1856922812, -751522268, -5098406, 356375750, 1863300093, 750250045, -638950352, 1092940192, -587861234, 478201070, -1428052155, -1695993807, -1618886839, -85270360, 1049235916, -218798047, -824819736, -1208829223, -1763606687, -1055579251, -695583957, -2124327015, 1338821594, 2024394737, -1260392421, -1063918748, -782765713, 109743002, -145873267, 2055065344, -1705839794, -2006674797, -2062417103, 202730061, 951098531, -1898972102, -1168641565, 1360719819, -255778355, -2004073000, -1079244743, 457208623, -1614898741, -557395473, -1684730672, -561518103, -1000614991, 901081754, -900767228, 601426296, 937614702, 306461062, 1948656569, 1161873092, -951048736, -2079626833, 2009426827, 345761982, 894304389, -1626697646, 721107868, -1546260301, -314002814, 1546549374, -1987137393, 89434850, 1384428534, 347295556, 352523830, 1209486423, 792832955, 945789467, 1481987152, -1330646784, -1495424737, 165941514, 849233153, -450936921, -306000977, -272260002, 1166933750, -1835758318, 1754539158, 1912811729, -962968957, 35491729, 77086292, 2032182834, -768831533, 36895537, -1862872003, -813956440, 1936119145, -1517947305, -1284864849, 197088676, -1816834394, 766141118, 1704433804, -1286731005, -1366250393, -2105571876, -1319799889, -1952775740, 780208014, -1868224405, 1375713954, -2084843209, -1998788056, 435680602, -226665783, 1886686846, 1141023512, -1048746225, -703537349, 1898029715, -826544384, 193015596, 1289698732, 1894753284, 1077460565, -1413630782, -1128807590, -312650750, -441906433, 812024957, 1439759401, -111074295, -453317645, -688962502, 736164362, 1942858881, 469223319, -741000212, 1639272820, -384926886, 1548079247, 2005072441, -1377331724, 1870633422, -420647417, -965368968, -1336963158, 626254252, -1896967653, 1104709886, 1650305990, -109692439, 905575854, -1018437694, 1450131897, 337549539, -1052131244, -1371148462, -1210879278, 325829703, 371811250, -1314100125, 318722185, -1067219145, -454382934, 1017004869, -673184472, 215569038, 1917072377, 841612531, 575096859, -1753887160, -655173093, -1077520139, -261905087, -139525991, -908097258, -1648619715, 391106743, 1197772952, -16553977, -1929234759, -1167717642, 269520794, 1181692381, 2094371358, -1282496015, 1642829565, 2090504319, -1628632322, -855632870, -1998929305, -2005169686, -1444815886, -1635151002, 522310787, 1152247591, -1493472039, 1943273938, -1090594941, 1517780680, 318350641, 1642543420, -1873809268, 858902114, -1429342033, -1936788517, -1910118381, -531252006, 1514768229, 2017068164, -311714590, -1453938274, 1220277834, -1515201405, 1492918427, -1321445854, 824217737, 69711112, 344075329, -1156418781, -858234117, 1510385381, 1293887522, -419809639, 805198488, 1290155937, 648169110, -1596135890, -1387098377, 719737079, -1965727635, -352219242, -1179114679, 113420698, -1100580052, 1161806690, 1798394793, -1287635506, 1711319718, 905970143, 833498743, -1172861974, 1696133848, 1110677564, 446283753, -1786110017, 726074790, 282466731, 1300013972, -301585085, -717404832, 330064591, -647904333, -476442234, 221418729, -1433405406, 1761512573, 2036266399, -755055013, -515076464, -1025441582, 1929424273, 610575639, -574041051, -1771809176, 1949280899, 330438175, -1646628381, -1980914855, 2031227420, -955729054, -452179264, -1922482972, 526417380, -879823317, -1654196472, 1971618492, 364294544, -1808651648, 1465862389, -586660593, -962265402, -1332157837, 670969217, -596811292, -1766892945, 1544647678, 1504764514, 1779720857, -796066866, -271080089, -1278141541, -735722508, 195610834, 1157960124, -293848541, -1425858879, -1986458541, -623467536, -797506645, 362056146, 212473745, -1689230474, -394425087, 236803916, -663485973, 382791623, -2110557961, -1783089878, 605555237, -1934032292, -738960547, 2082115192, 1009535724, 2058096498, -315510204, 1967590074, 1363950005, -2081587808, -1564304910, -1887221738, -513249529, 1016201736, 1745685937, 2135880179, 211905806, -344476266, 1831693079, 1141288276, -118984555, -2060149016, 1159444987, 168459664, 153236124, 1355368153, 1152255436, -936371786, 198972893, -539931264, 867184916, -961913580, -121637175, 711665406, 620741722, 1835568403, 1303814692, -1941377173, -1182006658, 1174059900, -1763035954, -1750857519, -1565579795, -779206992, 177944597, -1396932992, 726270712, -273068484, -726541808, -1701515442, 510058953, -1534596372, -1327913956, 280878654, -1324291206, 1501903306, -617432212, -1432536440, -223344901, 648272851, 1049403460, 1172066684, 1440998377, -1657616677, -956272919, -963375195, 1665642889, 935769943, -227285553, -241673136, 1484778263, 1223459057, -1369090146, -1113477316, -857822524, -396575091, -1934805436, -1080460314, -654920445, -421460888, 363895340, 968329203, -934954940, -391250906, -1987081563, 849626156, -508220569, -693708758, 360287008, -980578635, -1023114224, -1178122384, 1695913874, 551421118, 850857098, 1118854806, 496455002, 1669927590, 1178692316, -1883730260, 917300359, 200628049, 1896873548, 1474395826, 27411342, 940461528, 2012576033, -481257752, -2088375209, -197191349, -1089176207, 157562083, 1047250240, 652233055, -1868068007, -476240373, 1262878945, 405976126, 1840798212, 1640831637, -1481922735, 697505007, 2135664190, 1245141298, -1895666662, -1664600460, 394239754, 347585382, -1487276530, 381035314, 1140790277, 209178218, -1925146254, -1341135031, 1473940103, 2014241610, 526381613, -686309414, -631580353, -1831426169, 473611905, 1002793996, 701102146, 66667019, 1845832427, 1683030166, -954685976, 1409756506, -1665844891, -299911622, 1674235834, -516388511, 857219923, 479618590, -1596197028, -486496326, 1936913221, -1387911841, 1178003068, 1416486482, -1753084083, 1941756424, -1780031839, 631310713, 1097125154, 600937979, -1151984106, 821131791, -1487899646, -9718845, 1188428809, 1179526470, 1497410073, -450353559, 1394686547, 1689434288, -468243090, -1459390341, -499160796, -1426521368, 525051908, -300640878, 1893072528, -824541417, 371701919, -1736253654, 20573414, -801466790, 1557792708, -867996866, -1454633379, 1076138799, -1357611649, -1218451156, -101911350, 1024649994, 2064510389, -1361200787, 250745475, -420070058, -2062939969, -1033489643, -420779329, 1262162981, -1975462168, 342504846, 867790585, 104534415, 414173895, -903837451, 320487152, 691562486, 1511444547, -824139370, -1687900118, 1759405889, 724419348, -2141826340, -734847174, 1306390764, -1387519333, -1274503199, 1644933566, -1782654497, -1207306799, 1275759741, 1119346737, 600407037, -1037984361, 1719141678, -872449395, 1952815068, 463640920, 2003407205, -1050719844, 880494744, 979738192, 2087682557, 397274289, -1749298448, -1494363497, 1536907502, -825375091, -1927365192, 863691654, -1690567059, 486847271, -1671045364, -235694007, -1242028238, 519924606, -1024746180, -812516759, 1587795424, 226855760, -1959146050, -1778582851, -950964718, -644631463, -1390197917, 1171883645, -422190023, -340438029, 2052982681, -1977832966, -1843224151, 1850519927, 939966667, -1924095356, -1268955611, 2057000467, -1560070169, 1185885133, 1151163132, -504020751, 1117066095, -513373422, -828908883, 1106318419, -390007157, -1110690587, -1585942551, -1291087701, 148518137, 1064759725, -1770022059, -645964021, -2070414920, -360038513, 1974644765, -2087292635, -1723552797, -306772180, 1203905298, -1908503090, -1006565309, 717798204, 1404581219, 1471354530, -2142861998, -176305339, -2058853308, -885708772, -1187647843, -1098897499, 505294809, 873016398, 1700638994, 1292677676, -400009322, 771871928, 1583907455, -1170503765, 2014944246, 1715714187, -926555761, 549531937, 478492527, -898583714, 631347641, 1481846854, -166447365, 1354458445, 441638102, 693321932, -1003330601, 1142121597, 559614801, -364428855, -1693202299, -286296443, -2067751109, 1773786429, -861306983, 347265191, -2043474358, 1412861106, 110335122, 147240732, 79697243, -65169755, -940507213, -732786088, 1590535386, -1146805075, 736434977, -1291404919, -1309608661, -735887547, -581097353, 236726374, -1218530790, -2038950847, 800074848, -965821767, 1110904680, -1142088286, 699234900, -206311305, 1926286043, 1121289573, 2137631411, 682558149, -688680219, 1434125880, 877498383, -482382150, 1690388223, 1757292811, -1082614189, 2022631578, -1798036160, -1110541694, -217761131, -664609087, 645354853, 181159353, 5179676, -906072299, -2030780670, -1375402202, 1133466901, 643146272, -687258138, 1425984483, 957113511, -279068014, -1579275590, -400738553, -35169951, 1242709077, 1576684620, -901182146, 1958273577, -2031111477, -676273039, 1519344680, 1913066696, -2132576325, 1496240465, -736571815, 1811658424, -1216172679, -1660751546, 1264657029, 196766413, 1437134335, -2141281336, 35382391, -1260374368, -1303477343, 152603613, -612784234, 611664018, 402586310, -751191676, 1331166204, 663754801, -1486351662, 938275697, 791339626, -2109085621, 1732635166, 1457031384, 441281506, -430809018, 684162697, 424663432, 1710839254, 1643570932, 844291532, -217307719, -1911468693, -1858068682, 2116099367, -1906301027, 865954035, 903215997, 1973851065, -459129557, 2086634689, -1516832268, -1082178193, 275490211, -818190931, -1815615777, 839588370, 1239995079, 1523860565, 1235718686, -796000342, 291017469, -1444906757, 1048973760, -6896623, -435979846, -103379579, 1203128572, -85695905, -734513447, -1019769883, 2098200122, 1332470076, 710580430, -945189960, 1009459292, 1434508088, 461863800, 1760909738, 1849405969, 702643278, 462783532, -1744409804, -442210601, -257832395, 402812577]	
	switch(type) {
		case 'minimal': bmak.updatet = lodash.random(1,10);
		bmak.td = -999999;
		bmak.pe_cnt = 0;
		bmak.s = lodash.random(1,10);
		bmak.aj_type = 0;
		bmak.aj_indx = 0;
		bmak.getmr = '-1';
		bmak.nav_perm = '';
		bmak.fpValstr = '-1';
		bmak.p = 94;
		bmak.y = -1;
		break;

		case 'nomouse': bmak.updatet = (get_cf_date() - bmak.start_ts + add_random);
		bmak.td = lodash.random(20, 70);
		bmak.pe_cnt = 0;
		bmak.s = lodash.random(500, 2000);
		bmak.aj_type = 9;
		bmak.aj_indx = 1;
		bmak.getmr = getmr();
		bmak.nav_perm = '10321144241322243122';
		bmak.fpValstr = data(bmak.ua_browser).replace(/"/g, "\"")
		bmak.p = ab(bmak.fpValstr);
		bmak.z = canvasArray[bmak.y].toString()
		break;

		case 'mouse': bmak.genmouse = genMouseData(bmak);
		bmak.updatet = (get_cf_date() - bmak.start_ts + add_random);
		bmak.td = lodash.random(20, 70);
		bmak.pe_cnt = lodash.random(3,7);
		bmak.s = (get_cf_date() - bmak.start_ts);
		bmak.aj_type = 1;
		bmak.aj_indx = 2;
		bmak.getmr = getmr();
		bmak.nav_perm = '10321144241322243122';
		bmak.fpValstr = data(bmak.ua_browser).replace(/"/g, "\"")
		bmak.p = ab(bmak.fpValstr);
		bmak.z = canvasArray[bmak.y].toString()
		break;
	}
}

function dmact(bmak){
	return '0,' + (get_cf_date() - bmak.start_ts) + ',-1,-1,-1,-1,-1,-1,-1,-1,-1;';
}

/**
 * @param {string} abck - abck cookie
 * @param {string} site - website
 * @returns {object} object
 */
function verify_abck(abck, site, counter = null) {
	abck = abck.toString();
	writeToFile(`${abck}\n`);
	cookie_counter++;
	logger.purple(`Cookie #${cookie_counter}`)
	return site.valid_check.every(i => abck.includes(i)) ? {
		success: true,
		abck: abck
	} : {
		success: false,
		abck: abck
	}
}

/**
 * @returns {string} Random Mouse Movement
 */
function bezier(t, p0, p1, p2, p3) {
	var cX = 3 * (p1.x - p0.x),
		bX = 3 * (p2.x - p1.x) - cX,
		aX = p3.x - p0.x - cX - bX;

	var cY = 3 * (p1.y - p0.y),
		bY = 3 * (p2.y - p1.y) - cY,
		aY = p3.y - p0.y - cY - bY;

	var x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
	var y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;

	return {
		x: x,
		y: y
	};
};


/**
 * @returns Random Mouse Data
 */
function genMouseData(bmak) {
	var timeStamp = Math.round(get_cf_date() - (new Date() - 20)) + lodash.random(8000, 12000);
	var mouseString = '';
	p0 = {
		x: Math.floor(Math.random() * 212),
		y: Math.floor(Math.random() * 53)
	}, //use whatever points you want obviously
		p1 = {
			x: Math.floor(Math.random() * 123),
			y: Math.floor(Math.random() * 141)
		},
		p2 = {
			x: Math.floor(Math.random() * 231),
			y: Math.floor(Math.random() * 45)
		},
		p3 = {
			x: Math.floor(Math.random() * 91),
			y: Math.floor(Math.random() * 167)
		};
	var loop_amount = 100;
	for (var i = 0; i <= loop_amount; i++) {
		var p = bezier(i / 100, p0, p1, p2, p3);
		timeStamp = timeStamp + lodash.random(0, 2);
		if (i == loop_amount) {
			bmak.me_cnt = lodash.random(200, 1400),
				mouseString = mouseString + bmak.me_cnt + ',3,' + timeStamp + ',' + Math.round(p.x) + ',' + Math.round(p.y) + ',-1;';
		} else {
			bmak.me_vel = bmak.me_vel + i + 1 + timeStamp + Math.round(p.x) + Math.round(p.y),
				bmak.ta += timeStamp,
				mouseString = mouseString + i + ',1,' + timeStamp + ',' + Math.round(p.x) + ',' + Math.round(p.y) + ";";
		}
		mouseString = mouseString
	}

	return mouseString;
}
/**
 * @returns {string} MR Value
 */
function getmr() {
	try {
		//var log_counter = 0;
        for (var a = "", t = 1e3, e = [Math.abs, Math.acos, Math.asin, Math.atanh, Math.cbrt, Math.exp, Math.random, Math.round, Math.sqrt, isFinite, isNaN, parseFloat, parseInt, JSON.parse], n = 0; n < e.length; n++) {
            var o = [],
                m = 0,
                r = performance.now(),
                i = 0,
                c = 0;
            if (void 0 !== e[n]) {
                for (i = 0; i < t && m < .6; i++) {
                    for (var b = performance.now(), d = 0; d < 4e3; d++) e[n](3.14);
                    var k = performance.now();
					//console.log(`#${log_counter++} func [${e[n]}] 1e3*(k-b) ${1e3 * (k - b)}`)
                    o.push(Math.round(1e3 * (k - b))), m = k - r
                }
                var s = o.sort();
                c = s[Math.floor(s.length / 2)] / 5
            }
            a = a + c + ","
        }
        return a != null ? a : getmr();
    } catch (a) {
        return "exception"
    }
}

// function getmr() {
// 	var a = lodash.random(20, 500),
// 	b = lodash.random(20, 40),
// 	c = lodash.random(20, 40),
// 	d = lodash.random(20, 40),
// 	e = lodash.random(50, 140),
// 	f = lodash.random(50, 140)
	
// }


/**
 * @returns - bmak.doact
 */
function cdoa(bmak) {
	try {
		var t = get_cf_date() - bmak.start_ts + 105;
		var e = getFloatVal(lodash.random(0, 360));
		var n = getFloatVal(lodash.random(-180, 180));
		var o = getFloatVal(lodash.random(-90, 90));
		var m = bmak.doe_cnt + "," + t + "," + "-1" + "," + "-1" + "," + "-1";
		bmak.doact = m + ";";
		bmak.doe_vel = t;
		return bmak.doact;
	} catch (a) { }
};

/**
 * @returns - bmak.dmact
 */
function cdma(bmak) {
	try {
		var t = (get_cf_date() - bmak.start_ts) + 103;
		var m = "0," + t + ",-1,-1,-1,-1,-1,-1,-1,-1,-1";
		bmak.dmact = m + ";";
		bmak.dme_vel = t;
		return bmak.dmact;
	} catch (a) { }
};

async function getforminfo(site, userAgent, proxy) {
	var a = "",
		error_url = (site.error_page != null) ? site.error_page : `https://${site.host}/${randomstring.generate({length: 5,charset: 'alphabetic'})}`;
	var params = {
		method: 'GET',
		url: error_url,
		headers: {
			...site.headers,
			'user-agent': userAgent
		},
		proxy: proxy !== undefined ? `http://${proxy}` : null,
		timeout: 2000,
		html: true,
		resolveWithFullResponse: true,
	}
	function temp(doc) {
		const dom = new JSDOM(doc.toString());
		var size = dom.window.document.getElementsByTagName("input").length;
		//logger.green(`${size} inputs`);
		for (var t = "", n = -1, o = 0; o < size; o++) {
			var m = dom.window.document.getElementsByTagName("input")[o],
				r = ab(m.getAttribute("name")),
				i = ab(m.getAttribute("id")),
				c = m.getAttribute("required"),
				b = null == c ? 0 : 1,
				d = m.getAttribute("type"),
				k = null == d ? -1 : get_type(d),
				s = m.getAttribute("autocomplete");
			null == s ? n = -1 : (s = s.replace(/\\\"/g, '').replace('/', '').toLowerCase(), n = "off" == s ? 0 : "on" == s ? 1 : 2);
			var l = m.defaultValue.replace(/\\\"/g, '').replace('/', ''),
				u = m.value.replace(/\\\"/g, '').replace('/', ''),
				_ = 0,
				f = 0;
			l && 0 != l.length && (f = 1), !u || 0 == u.length || f && u == l || (_ = 1), 
			2 != k && (a = a + k + "," + n + "," + _ + "," + b + "," + i + "," + r + "," + f + ";"), 
			t = t + _ + ";"
		}
	}
	await cloudscraper(params).then(response => temp(response.body)).catch((e) => temp(e.message));
	return a;
}

function get_type(a) {
	return a = a.replace(/\\\"/g, '').toLowerCase(), "text" == a || "search" == a || "url" == a || "email" == a || "tel" == a || "number" == a ? 0 : "password" == a ? 1 : 2
}

function writeToFile(abck){
	fs.appendFile('abck.txt', abck, (e) => {
		if (e) throw e.message;
	});
}

module.exports = init;

// /* setInterval(() => */ init('dell', undefined, undefined) /*, 1000); */