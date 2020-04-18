const UserAgent = require('user-agents'),
	fs = require('fs'),
	performance = require('perf_hooks').performance,
	ciphers = [
        "AES128-SHA",
        "AES256-SHA"
	].join(":");
	url = require('url'),
	path = require('path'),
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
	{app, session, net, BrowserWindow} = require('electron'),
	originalConsoleError = console.error,
	ghost_cursor = require("ghost-cursor").path;
console.error = (e) => {
	if (lodash.startsWith(e, '[vuex] unknown') || lodash.startsWith(e, 'Error: Could not parse CSS stylesheet')) return;
	originalConsoleError(e)
}
let cookie_counter = 0,
	akamaiSession;
app.allowRendererProcessReuse = false;
app.on('ready', () => {
	let win = new BrowserWindow({'show': false});
	win.loadURL(
		url.format({
		  pathname: path.join(__dirname, "index.html"),
		  protocol: "file:",
		  slashes: true
		})
	  );
	akamaiSession = session.fromPartition('akamai', {cache: false});
	var userAgent = new UserAgent([/Chrome/, {deviceCategory: 'desktop', platform: 'MacIntel'}]).toString().replace(/\|"/g, "");
	var ua_browser = userAgent.toString().replace(/\|"/g, "").indexOf("Chrome") > -1 ? "chrome" : userAgent.toString().replace(/\|"/g, "").indexOf("Safari") > -1 ? "safari" : userAgent.toString().replace(/\|"/g, "").indexOf("Firefox") > -1 ? "firefox" : "ie";
	akamaiSession.setUserAgent(userAgent);
	init('footpatrol', userAgent, ua_browser, undefined, undefined)

	async function init(site, userAgent, ua_browser, proxy, abck, post_url, cookieJar){
		var site = (abck == null) ? websites.find(w => w.name === site) : site,
			bmak = {
				aj_indx: 0,
				aj_type: 0,
				den: 0,
				dmact: 0,
				dme_vel: 0,
				doact: 0,
				doe_cnt: 0,
				doe_vel: 0,
				fpValstr: "",
				genmouse: "",
				getmr: "",
				lang: "-",
				loc: "",
				me_cnt: 0,
				me_vel: 0,
				mn_abck: "",
				mn_al: [],
				mn_cc: "",
				mn_cd: 1000,
				mn_ct: 1,
				mn_il: [],
				mn_lc: [],
				mn_lcl: 0,
				mn_ld: [],
        		mn_lg: [],
				mn_mc_indx: 0,
				mn_mc_lmt: 10,
				mn_psn: "",
				mn_r: [],
				mn_sen: 0,
				mn_state: 0,
				mn_stout: 1e3,
				mn_tcl: [],
				mn_tout: 100,
				mn_ts: "",
				nav_perm: "",
				n_ck: 0,
				p: 0,
				pen: -1,
				pe_cnt: 0,
				plen: -1,
				prod: "-",
				psub: "-",
				s: 0,
				sensor_data: 0,
				start_ts: get_cf_date(true),
				ta: 0,
				td: 0,
				tst: -1,
				ua_browser: ua_browser,
				updatet: 0,
				vcact: "",
				ver: site.ver,
				wen: 0,
				xagg: -1,
				y: Math.floor(1e3 * Math.random()).toString(),
				z1: 0,
				z: -1
			},
			formInfo = await getforminfo(site, userAgent, proxy);
		// abck == null ? await switcher('minimal', bmak) : await switcher('nomouse', bmak);
		await switcher('nomouse', bmak);
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
				}).catch((e) => logger.red('exception ' + e.stack));
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
		var g = "", w = "", y = "";
		if(abck.includes("\|\|")) {
			bmak = await mn_poll(abck, bmak);
			bmak = await genChallengeMouseEvent(bmak);
			var h = await mn_get_current_challenges(abck);
			if (undefined !== h[1]) {
				logger.green('Filtering challenge 1')
				var C = h[1];
				undefined !== bmak.mn_r[C] && (g = bmak.mn_r[C])
			}
			if (undefined !== h[2]) {
				var E = h[2];
				logger.green('Filtering challenge 2')
				if(undefined !== bmak.mn_r[E]) w = bmak.mn_r[E]
			}
			if (undefined !== h[3]) {
				logger.green('Filtering challenge 3')
				var S = h[3];
				undefined !== bmak.mn_r[S] && (y = bmak.mn_r[S])
			}
		}

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
			// cdma(bmak) +
			"-1,2,-94,-114," +
			//bmak.pact
			"-1,2,-94,-103," +
			bmak.vcact +
			"-1,2,-94,-112," +
			site.url +
			"-1,2,-94,-115," +
			[1, bmak.me_vel + 32, 32, 0, 0, 0, bmak.me_vel, bmak.updatet, 0, bmak.start_ts, bmak.td, parseInt((parseInt(bmak.start_ts / (2016 * 2016))) / 23), 0, bmak.me_cnt, parseInt(parseInt((parseInt(bmak.start_ts / (2016 * 2016))) / 23) / 6), bmak.pe_cnt, 0, bmak.s, bmak.ta, 0, abck, ab(abck), bmak.y, bmak.z, 30261693].join(',') + //needs to be improved
			"-1,2,-94,-106," +
			bmak.aj_type + "," + bmak.aj_indx +
			"-1,2,-94,-119," +
			bmak.getmr +
			"-1,2,-94,-122," +
			sed() +
			"-1,2,-94,-123," +
			g +
			//h function (undefined)
			"-1,2,-94,-124," +
			w + 
			//g function (undefined)
			"-1,2,-94,-126," +
			y +
			"-1,2,-94,-127," +
			bmak.nav_perm;

		var k = ab(sensor_data);

		sensor_data =
			sensor_data +
			"-1,2,-94,-70," +
			bmak.fpValstr +
			"-1,2,-94,-80," +
			bmak.p +
			"-1,2,-94,-116," +
			to(bmak) +
			"-1,2,-94,-118," +
			k +
			"-1,2,-94,-121,";
		var sensor = await gen_key(sensor_data, bmak);
		validator(sensor, bmak, formInfo, userAgent, ua_browser, proxy, site, post_url, cookieJar)
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
				'authority': site.host,
				'user-agent': userAgent,
				'content-type': 'text/plain;charset=UTF-8',
				'accept': '*/*',
				'origin': `https://${site.host}`,
				'sec-fetch-site': 'same-origin',
				'sec-fetch-mode': 'cors',
				'referer': `https://${site.host}/`,
				'accept-encoding': 'gzip, deflate, br',
				'accept-language': 'en-US,en;q=0.9,fr;q=0.8,de;q=0.7',
				'dnt': '1',
			},
		};
		
		var req = net.request(options, function (res) {
			var chunks = [];
		
			res.on("data", function (chunk) {
				chunks.push(chunk);
			});
		
			res.on("end", function (chunk) {
				akamaiSession.cookies.get({}).then(async (cookies) => {
					var abck = cookies.find(x => x.name === "_abck").value;
					var verify = verify_abck(abck, site, true);
					verify.success ? logger.green(JSON.stringify(verify)) : logger.red(JSON.stringify(verify));
					init(site, userAgent, ua_browser, proxy, abck, post_url, cookieJar);
				}).catch((e) => logger.red(e.message));
			});
		
			res.on("error", function (error) {
			console.error(error);
			});
		});
		
		var postData = `{\"sensor_data\":\"${sensor}\"}`;

		req.write(postData);

		logger.yellow(sensor)
		
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
			// init(site, userAgent, ua_browser, proxy, abck, post_url, cookieJar);
		// }).catch(e => {
		// 	logger.red(e.message == "Error: ESOCKETTIMEDOUT" ? `[POST] Proxy Banned` : `[POST] ${e.message}`)
		// });
	}

	function gen_key(sensor_data, bmak) {
		var a = get_cf_date();
		var y = od("0a46G5m17Vrp4o4c", "afSbep8yjnZUjq3aL010jO15Sawj2VZfdYK8uY90uxq").slice(0, 16);
		var w = Math.floor(get_cf_date() / 36e5);
		var j = get_cf_date();
		var E = y + od(w, y) + sensor_data;
		sensor_data = E + ";" + lodash.random(0, 5) + ";" + bmak.tst + ";" + (get_cf_date() - j)
		return sensor_data;
	}

	function rir(a, t, e, n) {
		return a > t && a <= e && (a += n % (e - t)) > e && (a = a - e + t), a;
	}

	function get_cf_date(start) {
		if (Date.now) {
			return (start ? new Date(Date.now()).getTime() : Date.now());
		} else {
			return (start ? new Date(+new Date()).getTime() : +new Date());
		}
	}

	async function switcher(type, bmak){
		var add_random = lodash.random(40, 1600);
		var canvasArray = [-258688526,-380229768,-910147602,-642074913,1454575003,-1627350430,-2087321731,-552230799,681622556,1468298035,-968659517,792904753,1872114383,-768838012,-1422808916,-1690440540,918177569,-299824332,-1100926242,590387504,1204914753,-850342987,1434960077,-184491859,-252924566,-1590637647,-906906434,1994921761,-1014216413,490096504,1377200418,-320790731,-1003491391,-1593598986,-1959133361,-2024885122,473012774,-329194412,1033447141,1890175965,1099923539,-672395682,502393356,943657248,1303997989,1720664392,1665785846,-1039492718,1595197574,774758725,-2053610281,-1534714262,1345437442,-1672230605,419952338,-283135681,-1838110275,-479081611,336557930,-1949793014,-1875028898,-105344335,-56519046,-506985284,-133219342,717760806,683192729,-2023689198,-797584100,387610619,-624734334,-1559441329,98693687,482089505,1642163098,771424090,-2102473331,1596732241,365734556,-1036769400,-1828356990,-2126145962,-1880052230,-1823219244,-2049470082,509393476,671236453,-643946448,2023922389,-1548751671,892401278,935944785,1845025122,2606366,1109190367,463462894,-984871412,1522275505,-1998744585,1057016696,1516994777,899809789,-2056282797,-1401291820,1405341072,-1659079231,-1098063850,-1775584524,1167084910,-1203860934,-1739252648,1658412146,1012595405,1328031493,845785392,365563868,-100528605,1481032659,1164376938,-2054079242,-1134554344,1419213814,1277909185,445886213,1613561813,-1644599259,1372775405,873406024,-2045491203,175608234,1132364414,1741893195,987457133,-1516174339,-405450964,-82625416,-2080348235,-519820048,-1530580113,176993305,850728828,1234546812,1350393282,7645340,-1257794611,2121130236,993907753,909177413,-984538518,800661011,-1904734195,-278662786,733151654,1455681486,1139284331,-1209505346,-168824815,1337533696,482975363,-90780829,827715054,-1212852372,1387921604,-316044306,-1198197263,1352105616,-1048079677,-4901305,1981168010,801095379,-529550983,667233341,1452083482,263139143,449799980,-1248862444,1985197412,-492400093,165735080,971725205,624507096,1885720402,-1374252450,-161232591,930207515,-306696578,1260652560,564030182,-1690440424,1044398475,1605056938,606742522,-2112242920,1787970790,2130019848,1696807714,1524933943,-456086790,-883157529,-1976146447,-323217155,-954379794,1355634429,918764075,-1186630950,-522019341,-828390735,-2126970604,-632898889,200897686,1476230058,-1911364106,-650568971,1572861600,-1516942358,523475053,-1971008308,1005878714,161028307,570616773,1077436128,-935905905,1916171924,1174366911,-1237479794,-943904773,-1047765989,-1125300377,1612038834,-35000204,-107771871,-1389844782,-1028854978,1293591563,-1167839215,2058641366,1182808274,1165921662,217391223,-315998290,-1229038094,-1822001433,-187912077,1100692638,378695697,-494446180,-1554333920,-1453007041,984132648,140145595,-1955364192,-1604616878,310132848,-177965470,1135921945,1055114156,-1221961150,675514309,-339886135,2143817175,-1320546811,-587969387,-1922307056,-505386012,-1506827828,1358099373,1621629411,843462594,-523095756,409654245,-867192464,-767303534,-773094730,1813932073,-84577464,-986751055,1126894857,-322258131,1048330850,1838791977,-1571958021,-1589413718,-1006860530,-346424859,-796931837,1393120955,14855716,505786525,-643533959,113790283,1828888626,17324485,1239252261,1991762298,1912879515,-914799973,-153705403,-274048750,232854839,-373205660,-1908904817,-931491701,33790275,173335966,-2135953573,1429506244,-955312352,-1072513886,983187086,-1412830555,1596673802,1516879041,963515989,933704263,-2052288503,65844785,1488899022,17467309,-2012468492,-852978433,-1699263931,276533966,-195879488,1560790008,-276176615,1016937411,-1603358651,910685505,-1364955012,-1017437590,236760183,1725534116,-1559970395,-702952436,1234637032,121356017,-374242116,-1638850243,-1112094112,148913778,-1186882379,-1656367166,312158799,-231214470,1609361956,-2090251722,715337012,1861524823,-2039847086,2083787088,1574248546,884639223,-1790283213,-92856436,638775442,734547668,863468051,-223698491,1515381855,1781901138,-36416617,-735690133,706153569,438160177,-1033047417,1487339943,-869639204,-925445670,1808462405,50946879,394524621,706323612,765361903,1065314165,1893244412,1879968007,1342811245,1166009843,1034509870,893217566,-1044830369,2074449951,1472904622,858533177,976762486,1401081377,-565973016,245050634,-1035400908,-979069881,-1935615546,-926202838,-789344540,-1299821532,1350641492,756704389,732653660,806265358,1771619217,-1806637971,-1299526048,-921714080,1245951968,-1499933886,-514471883,961252547,-1600241058,-979445115,-480479628,829980267,941106298,525711418,-240296881,-1429532413,-1016477073,-2137745713,-312024775,-1038527564,-1311849555,1692812886,-1975257310,-1614522809,-474844608,-1048987855,-334605269,357011607,1903211848,-871403296,166496018,2132094792,-1419368974,1249301791,-987350054,942562193,-946143950,1420051882,-485339647,-1759902971,-1676860753,1291121709,-1590948176,-1991807083,717535678,-894148759,1078383725,-1440495522,-1482007412,922701385,-1987241925,-1299492863,-254338881,-85080367,1666295398,-599688957,-1946482893,1606837949,-754412071,242417931,-1226017357,806280314,1764097388,1917974438,-1229958227,-534668515,-1103786397,-820506042,-1154851989,789717163,1537236374,-1378630083,-1738305695,542601657,-1129862068,-443509507,-845081808,1242749413,-1841895320,-18012966,729844124,517133709,1010460475,621407935,886950167,1493179651,1670892287,-1735636821,-881424725,-1010583789,-817205306,1686815234,1648956571,480034744,-95853288,-580071365,1476003279,-14051860,1508713146,1014377593,246287052,1455654485,-299825011,-268747218,513105997,-217973441,-1087421795,-779996976,154630619,-1534839609,255899654,-1959670965,-1121161339,-1740773695,1523726831,-1151427033,-1847062949,29160895,16516272,-1638463703,1134544339,-1032662166,1349639910,1439005589,1928380368,-800978756,-1722212029,-22952513,-760365355,-1739833163,-1773862672,1157049676,-1921064576,-880371606,416719594,-1754108269,1125135107,603784203,-821599346,-1576981016,1853778667,-1877370610,2070635919,524486792,-1136421537,-1140216172,-380424975,1404024697,1040524592,-918006681,-2116893411,1177636017,-1813987613,-1955511204,-915346280,775660831,2187405,1193493515,282850357,-568141974,-1167613657,336694120,-1521806280,-851124730,279455890,-1046413370,175590908,-1293737519,-892109913,-1257998071,1027252794,-1034023587,-1903727290,1831115731,-514965615,201034976,692871038,-302903434,1966463954,770262050,2096457252,-749691641,-1295431555,329875092,1864688235,-57212845,1070175570,202856167,-2110628,-638892055,-834271936,-2041139586,-1112424664,-945810206,506104879,1308063270,-262599732,-636133997,-100507472,-1198494937,1845793138,-1748492529,-965757490,-266141959,391492585,999189973,-794269044,-770798309,-532268442,779907080,-1697282099,1943493379,-1768209806,-792269116,1255674906,1435887540,286132079,-1551834539,-2028799728,690667456,323944900,-498285799,-1735579108,-1638921255,1615028357,1410146618,923064790,-1219293980,-192925144,-1476773501,-1726149465,-1352524847,1574438244,-2114686162,623353945,1539583716,-1936544814,-625557109,-1850378022,-296786123,-1917306138,2119875620,-1256544066,1423959906,-1918664649,307157306,1305387685,702136856,-2081213803,2000529563,-1646669521,-1241881201,1184546978,-1831835215,-269585743,1897287603,-729993291,-760597134,-554743091,1654579694,-397248697,650970331,-355795650,-1329771447,-378714370,-1882959208,885128646,-1840808499,523033904,211461706,1458211852,1344021496,-1344629673,1554131943,221477349,-2140740438,-2094728770,433142806,149557752,-305508085,-218281914,-2038416455,1709855065,865951137,1384161526,-1566012780,-1078600774,1616115895,651299023,-1552762728,-400882637,-1986611575,1974809509,-1968890847,-1483947074,-2068264326,-872797655,-2046079536,1921907369,-188786761,1469307639,1271683050,-95806663,527928166,1979329417,1364384164,80083159,-1753357456,1926611114,1013093610,-153255278,-433637289,600352388,1910113175,843281291,1079529553,539335608,1188911425,1746072188,2068013213,-307008226,-2104701177,391742678,-360150762,-2144133911,-1645746788,2051312314,430425483,324855823,-1205225244,-1034678099,-374050393,-946043456,1955424182,-975669769,762276854,-857314060,-998560693,-578052362,-1499553884,-291351290,1690326096,-591580249,94377739,-833906175,779958138,-2058085455,2028279384,798645864,-210589242,-1701325717,1940788165,-1045317424,-542976023,-844552550,1946293243,999250251,550920105,-1604735723,-416716967,1252174709,1300291386,-212188266,558001247,1054248821,893180224,-512100532,1980317548,1843800547,1074809575,-1511651738,2138031004,1515134667,58860384,1582495396,-170570642,-304257926,384838318,1301853571,-472575317,-2096166160,872932967,-1378669788,1335144781,-369148539,-885736967,-1811935563,149328226,-1421003447,311538186,1956348216,-1365769595,-31766439,-2132925211,1029568641,637046469,-601862137,-1573470551,815916176,2050335435,-1089555714,-1421711902,-480591687,325317125,1812614504,1332755845,-1033971972,-655911794,-1637243605,-600594122,2025215381,-1315034565,154297519,2053584813,1409535141,535910440,-1934356819,-895408955,1459135497,-604295372,883658489,703051130,1914030205,-1753105422,-1714841549,-1961113770,1893921502,867246850,844199983,-2025624521,1674457409,1144662859,-468434663,-152996295,860208855,1930563111,1299410111,-2126368622,1091932033,-1448695275,1259662135,748635992,-1836079659,1227975603,482667487,-89159812,-2075380707,1690536291,690076925,969296919,-1166874454,632349224,-1062484194,1049070721,370601979,-1513703034,904680186,-2042648983,-1907617059,2057813156,1123068287,-1012199070,-1114398061,925087610,1475556409,1875246208,2064922467,1573376728,784287628,-1926896999,1298177385,-909654206,-685966616,262509527,1900749289,511092653,369721886,736217480,-1875147238,1542350551,-672901527,-370125508,-72120016,-1592799810,-918670348,-521498789,1115367753,2046442295,-893958995,1906215645,-467522783,-1170032566,-1300835752,1130820842,162830643,-1690938757,1210214650,981590209,-211648942,1188530149,-280172162,-1995919837,710932903,181857257,-1697875030,-1345614003,264465643,-379825717,-2076882578,533200158,-577398117,-687179673,-1313061805,-342997765,1180392947,1328950321,142178060,-367975685,1352221793,-760017623,1108050233,-611654777,871794052,238653167,1063358622,1283516056,-280337387,154958994,-92913881,-172712666,629480492,768999156,2003025250,-424053337,590906940,-1879159956,-146182503,1439644808,-1860335561,-1859965811,-1423950573,1431458228,-1416222855,1959538097,-1454392165,2099726725,1035870658,-1515465314,9698996,-723565764,-992591845,2082159340,655766253,-1254207960,203944385,-1959022703,-2009515897,-260196031,-626768058,-1539423197,784706541,-1964155249,993855571,-2083804049,1215008054,593156823,-13878337,1263752775,1073726159,986390186,-1726133962,-1360419847,-1072041758,447894757,-929769051,-571041888,1033841466,1583464646,911587120,-57607189,1459059972,-2094338290,1603664502,1934366767,356865128,1475176013,-172402483,1113038729,-41796291,272570950,186801301,1723843249,1587180766,360416223,-1808641695,994893307,802397304,-540255740,-1256861600,1349533949,33192664,-1443816258,2027772712]
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
			bmak.getmr = await getmr();
			bmak.nav_perm = '11321144241322243122';
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
			bmak.getmr = await getmr();
			bmak.nav_perm = '11321144241322243122';
			bmak.fpValstr = data(bmak.ua_browser).replace(/"/g, "\"")
			bmak.p = ab(bmak.fpValstr);
			bmak.z = canvasArray[bmak.y].toString()
			break;
		}
	}

	function verify_abck(abck, site) {
		abck = abck.toString();
		writeToFile(`${abck}\n`);
		cookie_counter++;
		logger.purple(`Cookie #${cookie_counter}`)
		return site.valid_check.every(i => !i.includes("!") && abck.includes(i.replace("!", "")) || i.includes("!") && !abck.includes(i.replace("!", ""))) ? {
			success: true,
			abck: abck
		} : {
			success: false,
			abck: abck
		}
	}

	/**
	 * ! {Browser Functions}
	 */

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
			['1440', '900', '1440', '900', '920', '789', '1440'],
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
			['1024', '768', '1024', '768', '1256', '605', '1272'],
			['1360', '728', '1360', '768', '1360', '625', '1358'],
			['1440', '797', '1440', '900', '1440', '685', '1440']
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

	function data(ua_browser) {
		// -36060876;-1849314799;
		return [canvas(), canvas_2(), "dis", pluginInfo(ua_browser), true, true, true, ((new Date).getTimezoneOffset()), webrtcKey(ua_browser), 24, 24, true, false, "1"].filter(x => x !== null).join(";")
	}

	function sed() {
		return [0, 0, 0, 0, 1, 0, 0].join(",");
	}

	function canvas() {
		return lodash.sample([-1151536724, -1152944628, -1259079336, -1618588580, -1752250632, -1752591854, -1880212897, -36060876, -434613739, -509993527, -52233038, -739578230, -746822318, 1112667908, 1454252292, 1544133244, 1637755981, 59688812, 73331404, 763748173]).toString();
	}

	function canvas_2() {
		return lodash.sample([-1849314799, 66351601, 1396487819]).toString();
	}

	async function getmr() {
		var mr;
		await win.webContents.executeJavaScript(`function x() {
			try {
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
							o.push(Math.round(1e3 * (k - b))), m = k - r
						}
						var s = o.sort();
						c = s[Math.floor(s.length / 2)] / 5
					}
					a = a + c + ","
				}
				return a != null ? a : x();
			} catch (a) {
				console.error(a);
			}
		}
		x();`).then((y) => { mr = y });
		return mr;
	}

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
			logger.green(`${size} inputs`);
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

	/**
	 * ! {Mouse Event Functions}
	 */

	function genMouseData(bmak) {
		var timeStamp = Math.round(get_cf_date() - (new Date() - 20)) + lodash.random(8000, 12000),
			mouseString = '',
			loop_amount = 100,
			generated = ghost_cursor({ x: lodash.random(100, 200), y: lodash.random(70, 230) }, { x: lodash.random(500, 800), y: lodash.random(470, 750) }),
			path = (generated.length > 100) ? generated : ghost_cursor({ x: lodash.random(100, 200), y: lodash.random(70, 230) }, { x: lodash.random(500, 800), y: lodash.random(470, 750) });
		for (var i = 0; i <= loop_amount; i++) {
			let point = path[i];
				x = Math.round(point.x),
				y = Math.round(point.y);
			timeStamp = timeStamp + lodash.random(0, 2);
			if (i == loop_amount) {
				bmak.me_cnt = lodash.random(200, 1400),
				mouseString = mouseString + bmak.me_cnt + ',3,' + timeStamp + ',' + x + ',' + y + ',-1;';
			} else {
				bmak.me_vel = bmak.me_vel + i + 1 + timeStamp + x + y,
				bmak.ta += timeStamp,
				mouseString = mouseString + i + ',1,' + timeStamp + ',' + x + ',' + y + ";";
			}
			mouseString = mouseString
		}

		return mouseString;
	}

	/**
	 * *This function will create the correct values for mouse movements required for challenge cookies
	 * @returns {bmak}
	 * *bmak.me_vel is added to cf_date and mouse event values. This should be within the 1000 range.
	 * ! The values {t, i, n, o} are subject to change!!!! This can be found at cma: function(){}
	 */

	function genChallengeMouseEvent(bmak) {
		var timing = lodash.random(900, 1400),
		t = 2,
		i = timing,
		n = -1,
		o = -1
		bmak.genmouse = `${bmak.me_cnt},${t},${i},${n},${o},-1,it0;`;
		bmak.vcact = `2,${lodash.random(3000, 5000)};`;
		bmak.me_vel = i + t + n + o + bmak.me_cnt;
		bmak.me_cnt++;
		bmak.ta = timing;
		bmak.updatet = timing + lodash.random(3000,5000);
		bmak.s = bmak.updatet + 1;
		return bmak;
	}

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
			var t = (get_cf_date() - bmak.start_ts) + 20;
			var m = "0," + t + ",-1,-1,-1,-1,-1,-1,-1,-1,-1";
			bmak.dmact = m + ";";
			bmak.dme_vel = t;
			return bmak.dmact;
		} catch (a) { }
	}

	// function dmact(bmak){
	// 	return '0,' + (get_cf_date() - bmak.start_ts) + ',-1,-1,-1,-1,-1,-1,-1,-1,-1;';
	// }
	

	/**
	 * ! {Challenge Cookie Functions}
	 */

	async function mn_poll(abck, bmak) {
		if (0 == bmak.mn_state) {
			var a = await get_mn_params_from_abck(abck),
				t = await mn_get_new_challenge_params(a, bmak);
			null != t && (await mn_update_challenge_details(t, bmak));
			return await mn_w(bmak)
		}
	}

	function get_mn_params_from_abck(abck) {
		var a = [
			[]
		];
		try {
			var t = abck;
			if (!1 !== t) {
				var e = decodeURIComponent(t).split("~");
				if (e.length >= 5) {
					var n = e[0],
						o = e[4],
						m = o.split("\|\|");
					if (m.length > 0)
						for (var r = 0; r < m.length; r++) {
							var i = m[r],
								c = i.split("-");
							if (c.length >= 5) {
								var b = pi(c[0]),
									d = c[1],
									k = pi(c[2]),
									s = pi(c[3]),
									l = pi(c[4]),
									u = 1;
								c.length >= 6 && (u = pi(c[5]));
								var _ = [b, n, d, k, s, l, u];
								2 == u ? a.splice(0, 0, _) : a.push(_)
							}
						}
				}
			}
		} catch (a) {}
		return a	
	}

	async function mn_get_current_challenges(abck) {
		var a = await get_mn_params_from_abck(abck),
			t = [];
		if (null != a)
			for (var e = 0; e < a.length; e++) {
				var n = a[e];
				if (n.length > 0) {
					var o = n[1] + n[2],
						m = n[6];
					t[m] = o
				}
			}
		return t
	}

	function mn_update_challenge_details(a, bmak) {
		bmak.mn_sen = a[0], bmak.mn_abck = a[1], bmak.mn_psn = a[2], bmak.mn_cd = a[3], bmak.mn_tout = a[4], bmak.mn_stout = a[5], bmak.mn_ct = a[6], bmak.mn_ts = bmak.start_ts, bmak.mn_cc = bmak.mn_abck + bmak.start_ts + bmak.mn_psn;
	}

	function mn_get_new_challenge_params(a, bmak) {
		var t = null,
			e = null,
			n = null;
		if (null != a)
			for (var o = 0; o < a.length; o++) {
				var m = a[o];
				if (m.length > 0) {
					for (var r = m[0], i = bmak.mn_abck + bmak.start_ts + m[2], c = m[3], b = m[6], d = 0; d < bmak.mn_lcl && (1 == r && bmak.mn_lc[d] != i && bmak.mn_ld[d] != c); d++);
					d == bmak.mn_lcl && (t = o, 2 == b && (e = o), 3 == b && (n = o))
				}
			}
		return null != n && bmak.pstate ? a[n] : null == e || bmak.pstate ? null == t || bmak.pstate ? null : a[t] : a[e]
	}

	async function mn_w(bmak) {
		//Called when you get challenge cookie
		try {
			for (var a = 0, t = 0, e = 0, n = "", o = get_cf_date(), m = bmak.mn_cd + bmak.mn_mc_indx; 0 == a;) {
				n = Math.random().toString(16);
				var r = bmak.mn_cc + m.toString() + n,
					i = mn_h(r);
				if (0 == bdm(i, m)) a = 1, e = get_cf_date() - o, bmak.mn_al.push(n), bmak.mn_tcl.push(e), bmak.mn_il.push(t), 0 == bmak.mn_mc_indx && (bmak.mn_lg.push(bmak.mn_abck), bmak.mn_lg.push(bmak.mn_ts), bmak.mn_lg.push(bmak.mn_psn), bmak.mn_lg.push(bmak.mn_cc), bmak.mn_lg.push(bmak.mn_cd.toString()), bmak.mn_lg.push(m.toString()), bmak.mn_lg.push(n), bmak.mn_lg.push(r), bmak.mn_lg.push(i));
				else if ((t += 1) % 1e3 == 0 && (e = get_cf_date() - o) > bmak.mn_stout) return setTimeout(mn_w(bmak), 1e3 + bmak.mn_stout);
			}
			bmak.mn_mc_indx += 1, bmak.mn_mc_indx < bmak.mn_mc_lmt ? await mn_w(bmak) : (bmak.mn_mc_indx = 0, bmak.mn_lc[bmak.mn_lcl] = bmak.mn_cc, bmak.mn_ld[bmak.mn_lcl] = bmak.mn_cd, bmak.mn_lcl = bmak.mn_lcl + 1, bmak.mn_state = 0, bmak.mn_r[bmak.mn_abck + bmak.mn_psn] = await mn_pr(bmak), bmak.aj_type = 8, bmak.aj_indx++);
			return bmak;
		} catch (a) {
			logger.red('exception on line ' + a.stack)
		}
	}

	function mn_pr(bmak) {
		return bmak.mn_al.join(",") + ";" + bmak.mn_tcl.join(",") + ";" + bmak.mn_il.join(",") + ";" + bmak.mn_lg.join(",") + ";";
	}

	/**
	* ! {Math Functions}
	*/

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

	function cc(a) {
		var t = a % 4;
		2 == t && (t = 3);
		var e = 42 + t;
		return String.fromCharCode(e)
	}

	//Used for determining how long challenge cookie verification loops for
	function mn_h(a) {
		var t = 1732584193,
			e = 4023233417,
			n = 2562383102,
			o = 271733878,
			m = 3285377520,
			r = encode_utf8(a),
			i = 8 * r.length;
		r += String.fromCharCode(128);
		for (var c = r.length / 4 + 2, b = Math.ceil(c / 16), d = new Array(b), k = 0; k < b; k++) {
			d[k] = new Array(16);
			for (var s = 0; s < 16; s++) d[k][s] = r.charCodeAt(64 * k + 4 * s) << 24 | r.charCodeAt(64 * k + 4 * s + 1) << 16 | r.charCodeAt(64 * k + 4 * s + 2) << 8 | r.charCodeAt(64 * k + 4 * s + 3) << 0
		}
		var l = i / Math.pow(2, 32);
		d[b - 1][14] = Math.floor(l), d[b - 1][15] = 4294967295 & i;
		for (var u = 0; u < b; u++) {
			for (var _, f, p, v = new Array(80), h = t, g = e, w = n, y = o, C = m, k = 0; k < 80; k++) v[k] = k < 16 ? d[u][k] : rotate_left(v[k - 3] ^ v[k - 8] ^ v[k - 14] ^ v[k - 16], 1), k < 20 ? (_ = g & w | ~g & y, f = 1518500249) : k < 40 ? (_ = g ^ w ^ y, f = 1859775393) : k < 60 ? (_ = g & w | g & y | w & y, f = 2400959708) : (_ = g ^ w ^ y, f = 3395469782), p = rotate_left(h, 5) + _ + C + f + v[k], C = y, y = w, w = rotate_left(g, 30), g = h, h = p;
			t += h, e += g, n += w, o += y, m += C
		}
		return [t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, 255 & t, e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, 255 & e, n >> 24 & 255, n >> 16 & 255, n >> 8 & 255, 255 & n, o >> 24 & 255, o >> 16 & 255, o >> 8 & 255, 255 & o, m >> 24 & 255, m >> 16 & 255, m >> 8 & 255, 255 & m]
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

	/**
	 * ! {Support Functions}
	 */

	function encode_utf8(a) {
		return unescape(encodeURIComponent(a))
	}

	function rotate_left(a, t) {
		return a << t | a >>> 32 - t;
	}

	function pi(a) {
		return parseInt(a);
	}

	function bdm(a, t) {
		for (var e = 0, n = 0; n < a.length; ++n) e = (e << 8 | a[n]) >>> 0, e %= t;
		return e;
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

	function ab(a) {
		if (null == a) return -1;
		for (var t = 0, e = 0; e < a.replace(/\\\"/g, '').replace('/', '').length; e++) {
			var n = a.replace(/\\\"/g, '').replace('/', '').charCodeAt(e);
			n < 128 && (t += n);
		}

		return t;
	}

	function writeToFile(abck){
		fs.appendFile('abck.txt', abck, (e) => {
			if (e) throw e.message;
		});
	}
});

// module.exports = init;

// /* setInterval(() => */ init('dell', undefined, undefined) /*, 1000); */