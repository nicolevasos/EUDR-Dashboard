document.addEventListener("DOMContentLoaded", function () {

  // ==========================================================
  // GLOBAL VARIABLES
  // ==========================================================

  let allData = [];

  let map = null;

  let markersLayer = null;


  // ==========================================================
  // DASHBOARD UPDATE
  // ==========================================================

  function updateDashboard(filtered, fitBounds = false) {

    updateTable(filtered);

    updatePie(filtered);

    updateBarCharts(filtered);

    updateIndicators(filtered);

    updateMap(filtered, fitBounds);

  }



  // ==========================================================
  // TABLE
  // ==========================================================

  function updateTable(filtered) {

    const tbody = d3.select("#riskTable tbody");

    tbody.html("");

    const grouped = d3.groups(
      filtered,
      d => d.Country || "Unknown"
    );


    grouped.forEach(([country, entries]) => {

      const plots = entries.length;


      const sumArea = d3.sum(
        entries,
        e => {
          const value = parseFloat(e.Area);
          return Number.isFinite(value) ? value : 0;
        }
      );


      const highRisk = entries.filter(
        e =>
          String(e.risk_pcrop || "").toLowerCase() === "high"
      ).length;


      const lowRisk = entries.filter(
        e =>
          String(e.risk_pcrop || "").toLowerCase() === "low"
      ).length;


      const needInfo = entries.filter(
        e =>
          String(e.risk_pcrop || "").toLowerCase() === "more_info_needed"
      ).length;


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



  // ==========================================================
  // PIE CHART
  // ==========================================================

  function updatePie(filtered) {

    const ctx = document.getElementById("riskPie");

    if (!ctx) return;


    if (ctx.chart) {
      ctx.chart.destroy();
    }


    const riskCounts = d3.rollup(
      filtered,
      v => v.length,
      d => d.risk_pcrop || "unknown"
    );


    const labels = Array.from(riskCounts.keys());

    const values = Array.from(riskCounts.values());


    const colorMap = {

      high: "#f87171",

      low: "#34d399",

      more_info_needed: "#fbbf24",

      unknown: "#9ca3af"

    };


    ctx.chart = new Chart(ctx, {

      type: "pie",

      data: {

        labels: labels,

        datasets: [

          {

            data: values,

            backgroundColor: labels.map(
              l => colorMap[String(l).toLowerCase()] || "#9ca3af"
            ),

            borderWidth: 0

          }

        ]

      },


      options: {

        responsive: true,

        maintainAspectRatio: true,

        plugins: {

          legend: {
            display: false
          },


          datalabels: {

            color: "#fff",

            formatter: function (value, ctx) {

              const total =
                ctx.chart.data.datasets[0].data
                  .reduce((a, b) => a + b, 0);


              if (!total) return "";


              return `${ctx.chart.data.labels[ctx.dataIndex]}: ${(
                (value / total) *
                100
              ).toFixed(1)}%`;

            },


            anchor: "end",

            align: "end",

            offset: 20,

            font: {
              weight: "bold"
            }

          }

        }

      },


      plugins: [ChartDataLabels]

    });

  }



  // ==========================================================
  // BAR CHARTS
  // ==========================================================

  function updateBarCharts(filtered) {

    const chartFields = {

      gfcChart: {

        before: "GFC_loss_before_2020",

        after: "GFC_loss_after_2020",

        title: "Disturbance detected by GFC"

      },


      tmfChart: {

        before: "Ind_tmf_before_2020",

        after: "TMF_def_after_2020",

        title: "Disturbance detected by TMF"

      },


      raddChart: {

        before: "RADD_before_2020",

        after: "RADD_after_2020",

        title: "Disturbance detected by RADD"

      },


      modisChart: {

        before: "MODIS_fire_before_2020",

        after: "MODIS_after_before_2020",

        title: "Fires detected by MODIS"

      }

    };


    Object.entries(chartFields).forEach(
      ([id, fields]) => {

        const beforeSum = d3.sum(
          filtered,
          d => {

            const value =
              parseFloat(d[fields.before]);

            return Number.isFinite(value)
              ? value
              : 0;

          }
        );


        const afterSum = d3.sum(
          filtered,
          d => {

            const value =
              parseFloat(d[fields.after]);

            return Number.isFinite(value)
              ? value
              : 0;

          }
        );


        const ctx =
          document.getElementById(id);


        if (!ctx) return;


        if (ctx.chart) {
          ctx.chart.destroy();
        }


        ctx.chart = new Chart(ctx, {

          type: "bar",


          data: {

            labels: [
              "before 2020",
              "after 2020"
            ],


            datasets: [

              {

                label: fields.title,

                data: [
                  beforeSum,
                  afterSum
                ],

                backgroundColor: [
                  "#34d399",
                  "#f87171"
                ]

              }

            ]

          },


          options: {

            responsive: true,

            maintainAspectRatio: false,


            plugins: {

              legend: {
                display: false
              },


              title: {

                display: true,

                text: fields.title,

                color: "#fff",

                align: "start",

                padding: {
                  top: 6,
                  bottom: 20,
                  left: 0
                }

              },


              tooltip: {

                callbacks: {

                  label: function (ctx) {

                    return `${ctx.dataset.label}: ${Number(
                      ctx.raw
                    ).toFixed(2)}`;

                  }

                }

              }

            }

          }

        });

      }
    );

  }



  // ==========================================================
  // INDICATORS
  // ==========================================================

  function updateIndicators(filtered) {


    const areaValue = d => {

      const value = parseFloat(d.Area);

      return Number.isFinite(value)
        ? value
        : 0;

    };


    const totalArea = d3.sum(
      filtered,
      areaValue
    );


    const before2020Area = d3.sum(

      filtered.filter(
        d =>
          String(
            d.Ind_03_disturbance_before_2020 || ""
          ).toLowerCase() === "yes"
      ),

      areaValue

    );


    const after2020Area = d3.sum(

      filtered.filter(
        d =>
          String(
            d.Ind_04_disturbance_after_2020 || ""
          ).toLowerCase() === "yes"
      ),

      areaValue

    );


    const primaryYesArea = d3.sum(

      filtered.filter(
        d =>
          String(
            d.Ind_05_primary_2020 || ""
          ).toLowerCase() === "yes"
      ),

      areaValue

    );


    const primaryNoArea = d3.sum(

      filtered.filter(
        d =>
          String(
            d.Ind_05_primary_2020 || ""
          ).toLowerCase() === "no"
      ),

      areaValue

    );


    const commodityYesArea = d3.sum(

      filtered.filter(
        d =>
          String(
            d.Ind_02_commodities || ""
          ).toLowerCase() === "yes"
      ),

      areaValue

    );


    const commodityNoArea = d3.sum(

      filtered.filter(
        d =>
          String(
            d.Ind_02_commodities || ""
          ).toLowerCase() === "no"
      ),

      areaValue

    );


    const treecoverYesArea = d3.sum(

      filtered.filter(
        d =>
          String(
            d.Ind_01_treecover || ""
          ).toLowerCase() === "yes"
      ),

      areaValue

    );


    const treecoverNoArea = d3.sum(

      filtered.filter(
        d =>
          String(
            d.Ind_01_treecover || ""
          ).toLowerCase() === "no"
      ),

      areaValue

    );


    const waterFlag = filtered.filter(

      d =>
        String(
          d.In_waterbody
        ).toLowerCase() === "false"

    ).length;



    // Primary forest

    d3.select("#primaryIndicator").html(`

      <span class="indicator-label">
        no
      </span>

      <br>

      <span class="indicator-value primary-value">
        ${primaryNoArea.toFixed(2)}
      </span>

      <br>

      <span class="indicator-label">
        yes
      </span>

      <br>

      <span class="indicator-value primary-value">
        ${primaryYesArea.toFixed(2)}
      </span>

      <br>

      <span class="indicator-label">
        Total area
      </span>

    `);



    // Commodity

    d3.select("#commodityIndicator").html(`

      <span class="indicator-label">
        no
      </span>

      <br>

      <span class="indicator-value commodity-value">
        ${commodityNoArea.toFixed(2)}
      </span>

      <br>

      <span class="indicator-label">
        yes
      </span>

      <br>

      <span class="indicator-value commodity-value">
        ${commodityYesArea.toFixed(2)}
      </span>

      <br>

      <span class="indicator-label">
        Total area
      </span>

    `);



    // Disturbance before 2020

    d3.select("#disturbancePre").html(`

      <span class="indicator-label">
        no
      </span>

      <br>

      <span class="indicator-value disturbance-pre-value">
        ${(totalArea - before2020Area).toFixed(2)}
      </span>

      <br>

      <span class="indicator-label">
        yes
      </span>

      <br>

      <span class="indicator-value disturbance-pre-value">
        ${before2020Area.toFixed(2)}
      </span>

      <br>

      <span class="indicator-label">
        Total area
      </span>

    `);



    // Disturbance after 2020

    d3.select("#disturbancePost").html(`

      <span class="indicator-label">
        no
      </span>

      <br>

      <span class="indicator-value disturbance-post-value">
        ${(totalArea - after2020Area).toFixed(2)}
      </span>

      <br>

      <span class="indicator-label">
        yes
      </span>

      <br>

      <span class="indicator-value disturbance-post-value">
        ${after2020Area.toFixed(2)}
      </span>

      <br>

      <span class="indicator-label">
        Total area
      </span>

    `);



    // Treecover

    d3.select("#treecover").html(`

      <span class="indicator-label">
        no
      </span>

      <br>

      <span class="indicator-value treecover-value">
        ${treecoverNoArea.toFixed(2)}
      </span>

      <br>

      <span class="indicator-label">
        yes
      </span>

      <br>

      <span class="indicator-value treecover-value">
        ${treecoverYesArea.toFixed(2)}
      </span>

      <br>

      <span class="indicator-label">
        Total area
      </span>

    `);



    // Water

    d3.select("#waterFlag").html(`

      <span class="indicator-label">
        false
      </span>

      <br>

      <span class="indicator-value">
        ${waterFlag.toFixed(2)}
      </span>

      <br>

      <span class="indicator-label">
        # of plots
      </span>

    `);

  }



  // ==========================================================
  // GEOJSON CENTROID CALCULATION
  // ==========================================================

  function getGeometryCentroid(geometry) {

    if (!geometry || !geometry.coordinates) {
      return null;
    }


    // --------------------------------------------------------
    // Point
    // --------------------------------------------------------

    if (geometry.type === "Point") {

      const [
        lon,
        lat
      ] = geometry.coordinates;

      return {
        lat,
        lon
      };

    }


    // --------------------------------------------------------
    // MultiPoint
    // --------------------------------------------------------

    if (geometry.type === "MultiPoint") {

      const coords =
        geometry.coordinates;

      return {

        lat: d3.mean(
          coords,
          c => c[1]
        ),

        lon: d3.mean(
          coords,
          c => c[0]
        )

      };

    }


    // --------------------------------------------------------
    // LineString
    // --------------------------------------------------------

    if (geometry.type === "LineString") {

      const coords =
        geometry.coordinates;

      return {

        lat: d3.mean(
          coords,
          c => c[1]
        ),

        lon: d3.mean(
          coords,
          c => c[0]
        )

      };

    }


    // --------------------------------------------------------
    // MultiLineString
    // --------------------------------------------------------

    if (
      geometry.type === "MultiLineString"
    ) {

      const coords =
        geometry.coordinates.flat();

      return {

        lat: d3.mean(
          coords,
          c => c[1]
        ),

        lon: d3.mean(
          coords,
          c => c[0]
        )

      };

    }


    // --------------------------------------------------------
    // Polygon
    // --------------------------------------------------------

    if (
      geometry.type === "Polygon"
    ) {

      const coords =
        geometry.coordinates[0];

      return {

        lat: d3.mean(
          coords,
          c => c[1]
        ),

        lon: d3.mean(
          coords,
          c => c[0]
        )

      };

    }


    // --------------------------------------------------------
    // MultiPolygon
    // --------------------------------------------------------

    if (
      geometry.type === "MultiPolygon"
    ) {

      const coords =
        geometry.coordinates.flat(2);

      return {

        lat: d3.mean(
          coords,
          c => c[1]
        ),

        lon: d3.mean(
          coords,
          c => c[0]
        )

      };

    }


    return null;

  }



  // ==========================================================
  // CONVERT GEOJSON → DASHBOARD DATA
  // ==========================================================

  function geoJSONToData(geojson) {

    if (!geojson) {

      throw new Error(
        "Empty GeoJSON file."
      );

    }


    if (
      geojson.type !== "FeatureCollection"
    ) {

      throw new Error(
        "GeoJSON must be a FeatureCollection."
      );

    }


    const features =
      geojson.features || [];


    if (!features.length) {

      throw new Error(
        "GeoJSON contains no features."
      );

    }


    return features.map(
      (feature, index) => {

        const properties =
          feature.properties || {};


        const centroid =
          getGeometryCentroid(
            feature.geometry
          );


        return {

          // ------------------------------------------------
          // Copy all GeoJSON properties
          // ------------------------------------------------

          ...properties,


          // ------------------------------------------------
          // Keep geometry
          // ------------------------------------------------

          _geometry:
            feature.geometry,


          // ------------------------------------------------
          // Centroid
          // ------------------------------------------------

          Centroid_lat:
            properties.Centroid_lat ??
            properties.centroid_lat ??
            (
              centroid
                ? centroid.lat
                : null
            ),


          Centroid_lon:
            properties.Centroid_lon ??
            properties.centroid_lon ??
            (
              centroid
                ? centroid.lon
                : null
            ),


          // ------------------------------------------------
          // Plot ID
          // ------------------------------------------------

          plotId:
            properties.plotId ??
            properties.plot_id ??
            properties.Plot_ID ??
            properties.id ??
            `plot_${index + 1}`

        };

      }
    );

  }



  // ==========================================================
  // LEAFLET MAP
  // ==========================================================

  function initializeMap() {

    if (map) {
      return;
    }


    map = L.map("map").setView(
      [0, 0],
      2
    );


    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {

        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',

        subdomains:
          "abcd",

        maxZoom:
          19

      }
    ).addTo(map);


    markersLayer =
      L.layerGroup().addTo(map);


    map.on(
      "moveend",
      applyFilters
    );

  }



  // ==========================================================
  // MAP UPDATE
  // ==========================================================

  function updateMap(
    filtered,
    fitBounds = false
  ) {

    initializeMap();


    markersLayer.clearLayers();


    const colorMap = {

      high: "#f87171",

      low: "#34d399",

      more_info_needed: "#fbbf24"

    };


    const latlngs = [];


    filtered.forEach(d => {


      const risk =
        String(
          d.risk_pcrop || ""
        ).toLowerCase();


      const color =
        colorMap[risk] ||
        "#9ca3af";


      // ------------------------------------------------------
      // Popup
      // ------------------------------------------------------

      const popup = `

        <strong>Plot ID:</strong>
        ${d.plotId ?? "N/A"}

        <br>

        <strong>Country:</strong>
        ${d.Country ?? "N/A"}

        <br>

        <strong>Risk:</strong>
        ${d.risk_pcrop ?? "N/A"}

        <br>

        <strong>Area:</strong>
        ${d.Area ?? "N/A"}

      `;



      // ======================================================
      // GEOJSON FEATURE
      // ======================================================

      if (d._geometry) {

        const geoLayer =
          L.geoJSON(

            {

              type: "Feature",

              geometry:
                d._geometry,

              properties:
                d

            },


            {

              style: {

                color:
                  color,

                weight:
                  1,

                fillColor:
                  color,

                fillOpacity:
                  0.35

              },


              pointToLayer:
                function (
                  feature,
                  latlng
                ) {

                  return L.circleMarker(
                    latlng,
                    {

                      radius:
                        4,

                      color:
                        "#fff",

                      fillColor:
                        color,

                      fillOpacity:
                        0.7,

                      weight:
                        1

                    }
                  );

                },


              onEachFeature:
                function (
                  feature,
                  layer
                ) {

                  layer.bindPopup(
                    popup
                  );

                }

            }

          ).addTo(
            markersLayer
          );


        // ----------------------------------------------------
        // Collect bounds
        // ----------------------------------------------------

        try {

          const bounds =
            geoLayer.getBounds();


          if (
            bounds &&
            bounds.isValid()
          ) {

            latlngs.push(
              bounds.getSouthWest()
            );

            latlngs.push(
              bounds.getNorthEast()
            );

          }

        } catch (error) {

          console.warn(
            "Could not calculate GeoJSON bounds:",
            error
          );

        }

      }



      // ======================================================
      // CSV POINT
      // ======================================================

      else {

        const lat =
          parseFloat(
            d.Centroid_lat
          );


        const lon =
          parseFloat(
            d.Centroid_lon
          );


        if (
          Number.isFinite(lat) &&
          Number.isFinite(lon)
        ) {

          latlngs.push([
            lat,
            lon
          ]);


          L.circleMarker(

            [
              lat,
              lon
            ],

            {

              radius:
                3,

              color:
                "#fff",

              fillColor:
                color,

              fillOpacity:
                0.5,

              weight:
                0

            }

          )

            .bindPopup(
              popup
            )

            .addTo(
              markersLayer
            );

        }

      }

    });



    // ========================================================
    // FIT MAP TO DATA
    // ========================================================

    if (
      fitBounds &&
      latlngs.length > 0
    ) {

      try {

        const bounds =
          L.latLngBounds(
            latlngs
          );


        if (
          bounds.isValid()
        ) {

          map.fitBounds(
            bounds,
            {
              padding:
                [20, 20]
            }
          );

        }

      } catch (error) {

        console.warn(
          "Could not fit map bounds:",
          error
        );

      }

    }

  }



  // ==========================================================
  // FILTER FUNCTION
  // ==========================================================

  function applyFilters() {

    if (!allData.length) {
      return;
    }


    const countryVal =
      d3.select(
        "#countryFilter"
      ).property(
        "value"
      );


    const admin2Val =
      d3.select(
        "#admin2Filter"
      ).property(
        "value"
      );


    let filtered =
      allData;



    // --------------------------------------------------------
    // Country filter
    // --------------------------------------------------------

    if (
      countryVal &&
      countryVal !== "All"
    ) {

      filtered =
        filtered.filter(
          d =>
            d.Country ===
            countryVal
        );

    }



    // --------------------------------------------------------
    // Admin filter
    // --------------------------------------------------------

    if (
      admin2Val &&
      admin2Val !== "All"
    ) {

      filtered =
        filtered.filter(
          d =>
            d.Admin_Level_1 ===
            admin2Val
        );

    }



    // --------------------------------------------------------
    // Map bounds filter
    // --------------------------------------------------------

    if (map) {

      const bounds =
        map.getBounds();


      filtered =
        filtered.filter(
          d => {

            const lat =
              parseFloat(
                d.Centroid_lat
              );


            const lon =
              parseFloat(
                d.Centroid_lon
              );


            if (
              !Number.isFinite(lat) ||
              !Number.isFinite(lon)
            ) {

              return false;

            }


            return bounds.contains([
              lat,
              lon
            ]);

          }
        );

    }



    updateDashboard(
      filtered,
      false
    );

  }



  // ==========================================================
  // LOAD DATA
  // ==========================================================

  function loadData(data) {

    if (!Array.isArray(data)) {

      throw new Error(
        "Invalid data format."
      );

    }


    if (!data.length) {

      throw new Error(
        "The uploaded file contains no data."
      );

    }


    // --------------------------------------------------------
    // Normalize data
    // --------------------------------------------------------

    allData =
      data.map(
        (d, index) => ({

          ...d,


          plotId:
            d.plotId ??
            d.plot_id ??
            d.Plot_ID ??
            d.id ??
            `plot_${index + 1}`

        })
      );



    // ========================================================
    // COUNTRY FILTER
    // ========================================================

    const countryFilter =
      d3.select(
        "#countryFilter"
      );


    countryFilter.html("");


    countryFilter
      .append("option")
      .attr("value", "All")
      .text("All");


    const countries =
      Array.from(

        new Set(

          allData
            .map(
              d =>
                d.Country
            )
            .filter(
              d =>
                d !== undefined &&
                d !== null &&
                d !== ""
            )

        )

      ).sort();


    countries.forEach(
      country => {

        countryFilter
          .append("option")
          .attr(
            "value",
            country
          )
          .text(
            country
          );

      }
    );



    // ========================================================
    // ADMIN LEVEL 1 FILTER
    // ========================================================

    const admin2Filter =
      d3.select(
        "#admin2Filter"
      );


    admin2Filter.html("");


    admin2Filter
      .append("option")
      .attr("value", "All")
      .text("All");


    const adminLevels =
      Array.from(

        new Set(

          allData
            .map(
              d =>
                d.Admin_Level_1
            )
            .filter(
              d =>
                d !== undefined &&
                d !== null &&
                d !== ""
            )

        )

      ).sort();


    adminLevels.forEach(
      admin => {

        admin2Filter
          .append("option")
          .attr(
            "value",
            admin
          )
          .text(
            admin
          );

      }
    );



    // ========================================================
    // FILTER EVENTS
    // ========================================================

    countryFilter.on(
      "change",
      function () {

        // Reset map-based filtering
        // when changing dropdowns

        updateDashboard(
          getDropdownFilteredData(),
          true
        );

      }
    );


    admin2Filter.on(
      "change",
      function () {

        updateDashboard(
          getDropdownFilteredData(),
          true
        );

      }
    );



    // ========================================================
    // RESET
    // ========================================================

    d3.select(
      "#resetBtn"
    ).on(
      "click",
      function () {

        countryFilter.property(
          "value",
          "All"
        );


        admin2Filter.property(
          "value",
          "All"
        );


        updateDashboard(
          allData,
          true
        );

      }
    );



    // ========================================================
    // INITIAL DASHBOARD
    // ========================================================

    updateDashboard(
      allData,
      true
    );


    // ========================================================
    // CLOSE MODAL
    // ========================================================

    document.getElementById(
      "modalOverlay"
    ).style.display = "none";

  }



  // ==========================================================
  // DROPDOWN FILTER ONLY
  // ==========================================================

  function getDropdownFilteredData() {

    const countryVal =
      d3.select(
        "#countryFilter"
      ).property(
        "value"
      );


    const admin2Val =
      d3.select(
        "#admin2Filter"
      ).property(
        "value"
      );


    let filtered =
      allData;


    if (
      countryVal &&
      countryVal !== "All"
    ) {

      filtered =
        filtered.filter(
          d =>
            d.Country ===
            countryVal
        );

    }


    if (
      admin2Val &&
      admin2Val !== "All"
    ) {

      filtered =
        filtered.filter(
          d =>
            d.Admin_Level_1 ===
            admin2Val
        );

    }


    return filtered;

  }



  // ==========================================================
  // DEFAULT DATASET
  // ==========================================================

  document
    .getElementById(
      "defaultDataBtn"
    )
    ?.addEventListener(
      "click",
      function () {

        d3.csv(
          "data/whisp_sample_data_global.csv"
        )

          .then(
            data => {

              loadData(
                data
              );

            }
          )

          .catch(
            error => {

              console.error(
                "Could not load default dataset:",
                error
              );


              alert(
                "Could not load the default dataset."
              );

            }
          );

      }
    );



  // ==========================================================
  // FILE UPLOAD
  // ==========================================================

  document
    .getElementById(
      "uploadDataInput"
    )
    ?.addEventListener(
      "change",
      function () {


        const file =
          this.files[0];


        if (!file) {
          return;
        }


        const reader =
          new FileReader();


        reader.onload =
          function (event) {


            try {


              const text =
                event.target.result;


              const fileName =
                file.name.toLowerCase();



              // =================================================
              // CSV
              // =================================================

              if (
                fileName.endsWith(
                  ".csv"
                )
              ) {


                const data =
                  d3.csvParse(
                    text
                  );


                if (!data.length) {

                  throw new Error(
                    "CSV file contains no rows."
                  );

                }


                loadData(
                  data
                );

              }



              // =================================================
              // GEOJSON / JSON
              // =================================================

              else if (

                fileName.endsWith(
                  ".geojson"
                ) ||

                fileName.endsWith(
                  ".json"
                )

              ) {


                const geojson =
                  JSON.parse(
                    text
                  );


                const data =
                  geoJSONToData(
                    geojson
                  );


                loadData(
                  data
                );

              }



              // =================================================
              // UNSUPPORTED
              // =================================================

              else {

                throw new Error(
                  "Unsupported file type. Please upload a CSV or GeoJSON file."
                );

              }


            }

            catch (error) {


              console.error(
                "Data loading error:",
                error
              );


              alert(

                "Could not load the file.\n\n" +
                error.message

              );

            }

          };


        reader.readAsText(
          file
        );

      }
    );



});