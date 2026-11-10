// Panchang tối giản: tithi (ngày âm Hindu), paksha, giờ mặt trời mọc/lặn theo thành phố, các ngày lễ.
// Tithi = phần nguyên của (kinh độ Mặt Trăng − kinh độ Mặt Trời) / 12°, tính tại lúc mặt trời mọc ở nơi người dùng ở.
(function (root) {
  const D2R = Math.PI / 180, norm = a => ((a % 360) + 360) % 360;
  const jd = ms => ms / 86400000 + 2440587.5;
  function sunLon(J) {
    const T = (J - 2451545) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * D2R) + (0.019993 - 0.000101 * T) * Math.sin(2 * M * D2R) + 0.000289 * Math.sin(3 * M * D2R);
    const om = 125.04 - 1934.136 * T;
    return norm(L0 + C - 0.00569 - 0.00478 * Math.sin(om * D2R));
  }
  // Meeus ch.47, các số hạng lớn (sai số ~0.02°)
  const MT = [[0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314], [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332],
    [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322], [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720], [0, 1, 1, 0, -30383],
    [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528], [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034], [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888],
    [2, 1, 0, 0, -6766], [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036], [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665],
    [0, 1, -2, 0, -2689], [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390], [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236], [0, 1, 2, 0, -2120], [0, 2, 0, 0, -2069]];
  function moonLon(J) {
    const T = (J - 2451545) / 36525;
    const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
    const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
    const E = 1 - 0.002516 * T;
    let s = 0;
    for (const [d, m, mp, f, c] of MT) { const e = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1; s += c * e * Math.sin((d * D + m * M + mp * Mp + f * F) * D2R); }
    s += 3958 * Math.sin((119.75 + 131.849 * T) * D2R) + 1962 * Math.sin((Lp - F) * D2R) + 318 * Math.sin((53.09 + 479264.29 * T) * D2R);
    return norm(Lp + s / 1e6);
  }
  const elong = ms => norm(moonLon(jd(ms)) - sunLon(jd(ms)));
  const tithiAt = ms => Math.floor(elong(ms) / 12) + 1; // 1..30

  // NOAA: giờ mặt trời mọc / lặn (UTC, phút từ 0h UTC) của ngày y-m-d tại lat/lon
  function sunTimes(y, m, d, lat, lon) {
    const start = Date.UTC(y, 0, 1), day = Math.round((Date.UTC(y, m - 1, d) - start) / 86400000) + 1;
    const g = 2 * Math.PI / 365 * (day - 1);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const c = Math.cos(90.833 * D2R) / (Math.cos(lat * D2R) * Math.cos(dec)) - Math.tan(lat * D2R) * Math.tan(dec);
    const ha = Math.acos(Math.max(-1, Math.min(1, c))) / D2R;
    const base = Date.UTC(y, m - 1, d);
    return { rise: base + (720 - 4 * (lon + ha) - eq) * 60000, set: base + (720 - 4 * (lon - ha) - eq) * 60000 };
  }

  const CITIES = [
    ['delhi', 'New Delhi', 'नई दिल्ली', 28.61, 77.21], ['mumbai', 'Mumbai', 'मुंबई', 19.08, 72.88], ['kolkata', 'Kolkata', 'कोलकाता', 22.57, 88.36],
    ['chennai', 'Chennai', 'चेन्नई', 13.08, 80.27], ['bengaluru', 'Bengaluru', 'बेंगलुरु', 12.97, 77.59], ['hyderabad', 'Hyderabad', 'हैदराबाद', 17.39, 78.49],
    ['ahmedabad', 'Ahmedabad', 'अहमदाबाद', 23.02, 72.57], ['pune', 'Pune', 'पुणे', 18.52, 73.86], ['jaipur', 'Jaipur', 'जयपुर', 26.91, 75.79],
    ['lucknow', 'Lucknow', 'लखनऊ', 26.85, 80.95], ['varanasi', 'Varanasi', 'वाराणसी', 25.32, 83.0], ['patna', 'Patna', 'पटना', 25.59, 85.14],
    ['bhopal', 'Bhopal', 'भोपाल', 23.26, 77.41], ['indore', 'Indore', 'इंदौर', 22.72, 75.86], ['nagpur', 'Nagpur', 'नागपुर', 21.15, 79.09],
    ['chandigarh', 'Chandigarh', 'चंडीगढ़', 30.73, 76.78], ['dehradun', 'Dehradun', 'देहरादून', 30.32, 78.03], ['guwahati', 'Guwahati', 'गुवाहाटी', 26.14, 91.74],
    ['bhubaneswar', 'Bhubaneswar', 'भुवनेश्वर', 20.3, 85.82], ['kochi', 'Kochi', 'कोच्चि', 9.93, 76.27], ['surat', 'Surat', 'सूरत', 21.17, 72.83],
    ['ranchi', 'Ranchi', 'रांची', 23.34, 85.31], ['raipur', 'Raipur', 'रायपुर', 21.25, 81.63], ['amritsar', 'Amritsar', 'अमृतसर', 31.63, 74.87],
    ['kathmandu', 'Kathmandu', 'काठमांडू', 27.72, 85.32], ['dubai', 'Dubai', 'दुबई', 25.2, 55.27], ['london', 'London', 'लंदन', 51.51, -0.13],
    ['newyork', 'New York', 'न्यूयॉर्क', 40.71, -74.01], ['sanfrancisco', 'San Francisco', 'सैन फ्रांसिस्को', 37.77, -122.42], ['chicago', 'Chicago', 'शिकागो', 41.88, -87.63],
    ['houston', 'Houston', 'ह्यूस्टन', 29.76, -95.37], ['toronto', 'Toronto', 'टोरंटो', 43.65, -79.38], ['sydney', 'Sydney', 'सिडनी', -33.87, 151.21],
    ['singapore', 'Singapore', 'सिंगापुर', 1.35, 103.82]
  ];
  const cityOf = id => CITIES.find(c => c[0] === id) || CITIES[0];
  function defaultCity() {
    let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; }
    const map = { 'Asia/Kolkata': 'delhi', 'Asia/Calcutta': 'delhi', 'Asia/Kathmandu': 'kathmandu', 'Asia/Dubai': 'dubai', 'Europe/London': 'london', 'America/New_York': 'newyork', 'America/Los_Angeles': 'sanfrancisco', 'America/Chicago': 'chicago', 'America/Toronto': 'toronto', 'Australia/Sydney': 'sydney', 'Asia/Singapore': 'singapore' };
    return map[tz] || 'delhi';
  }

  // Lễ lớn (giờ Ấn Độ), nguồn: HinduPad, Hindu Festivals 2027
  const FEST = {
    '2027-01-15': 'makar', '2027-02-11': 'vasant', '2027-03-06': 'shivaratri', '2027-03-21': 'holika', '2027-03-22': 'holi', '2027-04-15': 'ramnavami',
    '2027-04-20': 'hanumanjayanti', '2027-05-09': 'akshaya', '2027-08-17': 'rakhi', '2027-08-25': 'janmashtami', '2027-09-04': 'ganeshchaturthi',
    '2027-09-30': 'navratri', '2027-10-09': 'dussehra', '2027-10-27': 'dhanteras', '2027-10-29': 'diwali'
  };
  const pad = n => (n < 10 ? '0' : '') + n;
  const key = (y, m, d) => y + '-' + pad(m) + '-' + pad(d);

  // Thông tin một ngày (theo lịch của máy) cho thành phố cityId
  function day(date, cityId) {
    const c = cityOf(cityId), y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    const st = sunTimes(y, m, d, c[3], c[4]);
    const t = tithiAt(st.rise), tSet = tithiAt(st.set);
    const obs = [];
    if (t === 11 || t === 26) obs.push('ekadashi');
    if (t === 15) obs.push('purnima');
    if (t === 30) obs.push('amavasya');
    if (tSet === 13 || tSet === 28) obs.push('pradosh');
    if (tSet === 19) obs.push('sankashti');
    const f = FEST[key(y, m, d)];
    return { tithi: t, paksha: t <= 15 ? 'shukla' : 'krishna', idx: t <= 15 ? t : t - 15, rise: st.rise, set: st.set, obs, fest: f || null, key: key(y, m, d) };
  }
  function upcoming(from, n) {
    const out = [], k0 = key(from.getFullYear(), from.getMonth() + 1, from.getDate());
    Object.keys(FEST).sort().forEach(k => { if (k >= k0 && out.length < n) out.push([k, FEST[k]]); });
    return out;
  }
  root.Panchang = { day, upcoming, CITIES, cityOf, defaultCity, tithiAt, sunTimes };
})(window);
