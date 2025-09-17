document.addEventListener("DOMContentLoaded", function(){

let allData;
let map, markersLayer;

// ----- Dashboard Updates -----
function updateDashboard(filtered, fitBounds=false){
  updateTable(filtered);
  updatePie(filtered);
  updateBarCharts(filtered);
  updateIndicators(filtered);
  updateMap(filtered, fitBounds);
}

// ----- Table -----
function updateTable(filtered){
  const tbody = d3.select("#riskTable tbody");
  tbody.html("");
  const grouped = d3.groups(filtered, d=>d.Country);
  grouped.forEach(([country, entries])=>{
    const plots = entries.length;
    const sumArea = d3.sum(entries, e=>+e.Area);
    const highRisk = entries.filter(e=>e.risk_pcrop==='high').length;
    const lowRisk = entries.filter(e=>e.risk_pcrop==='low').length;
    const needInfo = entries.filter(e=>e.risk_pcrop==='more_info_needed').length;
    tbody.append("tr").html(`
      <td>${country}</td>
      <td>${plots}</td>
      <td>${sumArea.toFixed(2)}</td>
      <td>${highRisk}</td>
      <td>${lowRisk}</td>
      <td>${needInfo}</td>
    `);
  });
}

// ----- Pie Chart -----
function updatePie(filtered){
  const ctx = document.getElementById('riskPie');
  if(!ctx) return; // safeguard
  if(ctx.chart) ctx.chart.destroy();

  const riskCounts = d3.rollup(filtered, v => v.length, d => d.risk_pcrop);
  const labels = Array.from(riskCounts.keys());
  const values = Array.from(riskCounts.values());
  const colorMap = { high:"#f87171", low:"#34d399", more_info_needed:"#fbbf24" };

  ctx.chart = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets:[{ data: values, backgroundColor: labels.map(l=>colorMap[l]||"#9ca3af"), borderWidth:0 }] },
    options: { responsive:true, maintainAspectRatio:true, plugins:{ legend:{display:false}, datalabels:{ color:'#fff', formatter:(value,ctx)=>{ const total=ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0); return `${ctx.chart.data.labels[ctx.dataIndex]}: ${((value/total)*100).toFixed(1)}%`; }, anchor:'end', align:'end', offset:20, font:{weight:'bold'} } } },
    plugins: [ChartDataLabels]
  });
}

// --------------------
// BAR CHARTS
// --------------------
function updateBarCharts(filtered){
  const chartFields = {
    gfcChart: { before: "GFC_loss_before_2020", after: "GFC_loss_after_2020", title: "Disturbance detected by GFC" },
    tmfChart: { before: "Ind_tmf_before_2020", after: "TMF_def_after_2020", title: "Disturbance detected by TMF" },
    raddChart: { before: "RADD_before_2020", after: "RADD_after_2020", title: "Disturbance detected by RADD" },
    modisChart: { before: "MODIS_fire_before_2020", after: "MODIS_after_before_2020", title: "Fires detected by MODIS" }
  };

  Object.entries(chartFields).forEach(([id, fields])=>{
    const beforeSum = d3.sum(filtered,d=>+d[fields.before]||0);
    const afterSum  = d3.sum(filtered,d=>+d[fields.after]||0);
    const ctx = document.getElementById(id);
    if(ctx.chart) ctx.chart.destroy();
    ctx.chart = new Chart(ctx, {
      type: "bar",
      data: { labels: ["before 2020", "after 2020"], datasets: [{ label: fields.title, data: [beforeSum, afterSum], backgroundColor: ["#34d399","#f87171"] }] },
      options: { responsive: true, maintainAspectRatio:false, plugins:{ legend:{display:false}, title:{ display:true, text:fields.title, color:"#fff", align:'start', padding:{top:6,bottom:20,left:0} }, tooltip:{ callbacks:{ label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(2)}` } } } }
    });
  });
}

// --------------------
// INDICATORS
// --------------------
function updateIndicators(filtered){
  const totalArea = d3.sum(filtered,d=>+d.Area);
  const before2020Area = d3.sum(filtered.filter(d=>d.Ind_03_disturbance_before_2020==='yes'), d=>+d.Area);
  const after2020Area = d3.sum(filtered.filter(d=>d.Ind_04_disturbance_after_2020==='yes'), d=>+d.Area);
  const primaryYesArea = d3.sum(filtered.filter(d=>d.Ind_05_primary_2020==='yes'), d=>+d.Area);
  const primaryNoArea = d3.sum(filtered.filter(d=>d.Ind_05_primary_2020==='no'), d=>+d.Area);
  const commodityYesArea = d3.sum(filtered.filter(d=>d.Ind_02_commodities==='yes'), d=>+d.Area);
  const commodityNoArea = d3.sum(filtered.filter(d=>d.Ind_02_commodities==='no'), d=>+d.Area);
  const treecoverYesArea = d3.sum(filtered.filter(d=>d.Ind_01_treecover==='yes'), d=>+d.Area);
  const treecoverNoArea = d3.sum(filtered.filter(d=>d.Ind_01_treecover==='no'), d=>+d.Area);
  const waterFlag = filtered.filter(d => d.In_waterbody.toLowerCase() === 'false').length;

  d3.select("#primaryIndicator").html(`<span class="indicator-label">no</span><br><span class="indicator-value primary-value">${primaryNoArea.toFixed(2)}</span><br><span class="indicator-label">yes</span><br><span class="indicator-value primary-value">${primaryYesArea.toFixed(2)}</span><br><span class="indicator-label">Total area</span>`);
  d3.select("#commodityIndicator").html(`<span class="indicator-label">no</span><br><span class="indicator-value commodity-value">${commodityNoArea.toFixed(2)}</span><br><span class="indicator-label">yes</span><br><span class="indicator-value commodity-value">${commodityYesArea.toFixed(2)}</span><br><span class="indicator-label">Total area</span>`);
  d3.select("#disturbancePre").html(`<span class="indicator-label">no</span><br><span class="indicator-value disturbance-pre-value">${(totalArea-before2020Area).toFixed(2)}</span><br><span class="indicator-label">yes</span><br><span class="indicator-value disturbance-pre-value">${before2020Area.toFixed(2)}</span><br><span class="indicator-label">Total area</span>`);
  d3.select("#disturbancePost").html(`<span class="indicator-label">no</span><br><span class="indicator-value disturbance-post-value">${(totalArea-after2020Area).toFixed(2)}</span><br><span class="indicator-label">yes</span><br><span class="indicator-value disturbance-post-value">${after2020Area.toFixed(2)}</span><br><span class="indicator-label">Total area</span>`);
  d3.select("#treecover").html(`<span class="indicator-label">no</span><br><span class="indicator-value treecover-value">${treecoverNoArea.toFixed(2)}</span><br><span class="indicator-label">yes</span><br><span class="indicator-value treecover-value">${treecoverYesArea.toFixed(2)}</span><br><span class="indicator-label">Total area</span>`);
  d3.select("#waterFlag").html(`<span class="indicator-label">false</span><br><span class="indicator-value">${waterFlag.toFixed(2)}</span><br><span class="indicator-label"># of plots</span>`);
}

// --------------------
// LEAFLET MAP
// --------------------
function updateMap(filtered, fitBounds=false){
  if(!map){
    map = L.map('map').setView([0,0],2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd', maxZoom:19
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    map.on('moveend', applyFilters);
  }

  markersLayer.clearLayers();

  filtered.forEach(d=>{
    const colorMap = { high:"#f87171", low:"#34d399", more_info_needed:"#fbbf24" };
    const color = colorMap[d.risk_pcrop]||"#9ca3af";

    L.circleMarker([+d.Centroid_lat,+d.Centroid_lon], {radius:3, color:'#fff', fillColor:color, fillOpacity:0.5, weight:0})
      .bindPopup(`<strong>Plot ID:</strong> ${d.plotId}<br><strong>Country:</strong> ${d.Country}<br><strong>Risk:</strong> ${d.risk_pcrop}<br><strong>Area:</strong> ${d.Area}`)
      .addTo(markersLayer);
  });

  if(fitBounds && filtered.length>0){
    const latlngs = filtered.map(d=>[+d.Centroid_lat,+d.Centroid_lon]);
    map.fitBounds(latlngs,{padding:[20,20]});
  }
}

// --------------------
// FILTER FUNCTION
// --------------------
function applyFilters(){
  const countryVal = d3.select("#countryFilter").property("value");
  const admin2Val = d3.select("#admin2Filter").property("value");
  let filtered = allData;
  if(countryVal!=="All") filtered = filtered.filter(d=>d.Country===countryVal);
  if(admin2Val!=="All") filtered = filtered.filter(d=>d.Admin_Level_1===admin2Val);
  if(map){ const bounds = map.getBounds(); filtered = filtered.filter(d=>bounds.contains([+d.Centroid_lat,+d.Centroid_lon])); }
  updateDashboard(filtered,false);
}

// --------------------
// DATA LOAD
// --------------------
function loadData(data){
  allData = data;
  const countryFilter = d3.select("#countryFilter");
  const admin2Filter = d3.select("#admin2Filter");

  countryFilter.html("").append("option").text("All");
  Array.from(new Set(data.map(d=>d.Country))).forEach(c=>countryFilter.append("option").text(c));

  admin2Filter.html("").append("option").text("All");
  Array.from(new Set(data.map(d=>d.Admin_Level_1))).forEach(a=>admin2Filter.append("option").text(a));

  countryFilter.on("change", applyFilters);
  admin2Filter.on("change", applyFilters);

  d3.select("#resetBtn").on("click", ()=>{
    countryFilter.property("value","All");
    admin2Filter.property("value","All");
    updateDashboard(allData,true);
  });

  updateDashboard(allData,true);
  document.getElementById("modalOverlay").style.display = "none";
}

// --------------------
// EVENT LISTENERS
// --------------------
document.getElementById("defaultDataBtn")?.addEventListener("click", ()=>{
  d3.csv("data/whisp_sample_data_global.csv").then(loadData);
});

document.getElementById("uploadDataInput")?.addEventListener("change", function(){
  const file = this.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = e => loadData(d3.csvParse(e.target.result));
    reader.readAsText(file);
  }
  });
});
