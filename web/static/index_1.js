

let availabilityData = [];
let heatmap;
let stationsData = [];
let bikeLayer;



function getStations() {
  fetch("/stations")
    .then((response) => response.json())
    .then((stations) => {
      fetch("/availability") // 获取 availability 表数据的 API
        .then((response) => response.json())
        .then((availability) => {
          // Combine station data with availability data
          stationsData = stations.map((station) => {
            const stationAvailability = availability.find(
              (item) => item.number === station.number
            );
            return { ...station, ...stationAvailability };
          }).sort((a, b) => b.available_bikes - a.available_bikes); // 根据 available_bikes 排序
          
          console.log("fetch response", typeof stationsData);
          addMarkers(stationsData);
          drawHeatmap(stationsData);
          populateSearchBoxByNumber(stationsData); // 添加这一行
        });
    });
}


function initMap() {
  google.charts.load('current', { packages: ['corechart'] });
  const dublin = { lat: 53.35014, lng: -6.266155 };
  // The map, centered at Dublin

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: dublin,
    mapId: "60579be615b58573",//應用自定義樣式
  });



  const heatmapControlDiv = document.getElementById("heatmap-control");
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(heatmapControlDiv);


  // bikeLayer = new google.maps.BicyclingLayer();

  // const bikeLayerCheckbox = document.getElementById("bikeLayer");
  // bikeLayerCheckbox.addEventListener("change", toggleBikeLayer);

  // // 如果复选框已选中，则立即调用 toggleBikeLayer
  // if (bikeLayerCheckbox.checked) {
  //   toggleBikeLayer();
  // }
  

  const searchResultIcon = {
    url: "http://maps.google.com/mapfiles/kml/pal4/icon47.png", // URL to red marker icon
    scaledSize: new google.maps.Size(32, 32), // 调整图标大小
    origin: new google.maps.Point(0, 0), // 图标的起点（左上角）
    anchor: new google.maps.Point(16, 32), // 图标的定位点相对于图标起点的偏移量（将其设置在底部中心）
  };

  // Create the search box and link it to the UI element.
  const input = document.getElementById("search-box");
  const searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.LEFT_TOP].push(input);
  // 添加自定义偏移
  input.style.marginTop = "10px";
  input.style.marginLeft = "10px";
  // Bias the SearchBox results towards current map's viewport.
  map.addListener("bounds_changed", () => {
    searchBox.setBounds(map.getBounds());
  });

  let currentSearchMarker = null;
  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();

    if (places.length === 0) {
      return;
    }

    // 在创建新标记之前移除旧标记
    if (currentSearchMarker) {
      currentSearchMarker.setMap(null);
    }

    // For each place, get the icon, name, and location.
    const bounds = new google.maps.LatLngBounds();
    places.forEach((place) => {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }

      // Create a marker for each place.
      const newMarker = new google.maps.Marker({
        map,
        icon: searchResultIcon, // 使用自定义图标
        title: place.name,
        position: place.geometry.location,
      });

      // 将新标记分配给 currentSearchMarker
      currentSearchMarker = newMarker;

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });

    map.fitBounds(bounds);
  });

  const inputNumber = document.getElementById("search-box-number");
  map.controls[google.maps.ControlPosition.LEFT_TOP].push(inputNumber);

  // 添加自定义偏移
  inputNumber.style.marginTop = "20px";
  inputNumber.style.marginLeft = "10px";

  inputNumber.addEventListener("change", () => {
    const stationNumber = parseInt(inputNumber.value, 10);
    const station = stationsData.find((s) => s.number === stationNumber);

    if (station) {
      const stationLatLng = new google.maps.LatLng(station.position_lat, station.position_lng);
      map.setCenter(stationLatLng);
      map.setZoom(25);
    } else {
      alert("Station not found");
    }
  });




  getStations();
  //setInterval(getStations, 60 * 1000); // 每60秒获取一次实时数据
  // heatmap = new google.maps.visualization.HeatmapLayer();
  // heatmap.set("radius", 1800);
}


let currentInfoWindow = null;

function addMarkers(stations) {

  const emptyIcon = {
    url: "none.png",
    scaledSize: new google.maps.Size(38, 38),
    anchor: new google.maps.Point(24, 50),
  };

  const normalIcon = {
    url: "point.png",
    scaledSize: new google.maps.Size(60, 60),
    anchor: new google.maps.Point(25, 55),
  };
  

    const top1Icon = {
      url: "top1_marker1.png",
      scaledSize: new google.maps.Size(43, 50),
      anchor: new google.maps.Point(25, 55),
    };
    
    const top2Icon = {
      url: "top2_marker1.png",
      scaledSize: new google.maps.Size(43, 50),
      anchor: new google.maps.Point(23, 55),
    };
    
    const top3Icon = {
      url: "top3_marker1.png",
      scaledSize: new google.maps.Size(44, 50),
      anchor: new google.maps.Point(23, 55),
    };
  
  for (const [index, station] of stations.entries()) {

    const availableBikes = station.available_bikes;
    
    const hoverIcon = {
      url: 'hover_marker.png',
      scaledSize: new google.maps.Size(60, 60), // 调整图标大小
      anchor: new google.maps.Point(33, 45), // 调整图标偏移
    };

    //console.log(station);
    const marker = new google.maps.Marker({
      position: {
        lat: station.position_lat,
        lng: station.position_lng,
      },
      map: map,
      title: station.name,
      station_number: station.number,
      animation: google.maps.Animation.DROP,//添加動畫效果
    });


    // 添加 mouseover 事件侦听器
    marker.addListener('mouseover', () => {
      marker.setIcon(hoverIcon);
    });
    // 添加 mouseout 事件侦听器
    marker.addListener('mouseout', () => {
        // 根据排名设置图标
        if (station.available_bikes === 0) {
          marker.setIcon(emptyIcon);
        } 
        else if (index === 0) {
          marker.setIcon(top1Icon);
        } else if (index === 1) {
          marker.setIcon(top2Icon);
        } else if (index === 2) {
          marker.setIcon(top3Icon);
        }else {
        marker.setIcon(null); // 将图标设置为 null 以恢复默认图标
        }
    });

    const contentString = '<style>' +
  'h3 { font-size: 18px; text-align: left; margin-bottom: 10px; }' +
  'p, strong { font-size: 14px; text-align: left; line-height: 1.3; }' +
  'input { display: inline-block; }' + // 使输入框左对齐
  '</style>' +
  '<div>' +
  '<h3 id="firstHeading" class="firstHeading">' + station.number + "." + station.name + '</h3>' +
  '<p><strong>Station Address:   </strong>' + station.address + '</p>' +
  '<p><strong>Original Bike Stands:   </strong>' + station.bike_stands + '</p>' +
  '<p><strong>Latest Available Bike Number:   </strong>' + station.available_bikes + '</p>' +
  '<p><strong>Latest Available Bike stand Number:   </strong>' + station.available_bike_stands + '</p>' +
  '<p><strong>Latest update time:   </strong>' +  new Date(station.last_update ).toLocaleString()  + '</p>' +
  '<p><strong>Business Status:   </strong>' + station.status + '</p>' +
  '<p style="color: orange;"><strong>View the Number of Bikes available historically</strong></p>' +
  '<input id="inputDate" type="text" placeholder="Enter date (YYYY-MM-DD)"/>' +
  '<button id="btnLoadData" style="background-color: yellowgreen; color: white; border: none; padding: 5px 12px; font-size: 14px;">Search!</button>' +
  '</div>';
    //const contentString =node;

    const infowindow = new google.maps.InfoWindow({
      content: contentString
    });

    marker.addListener("click", () => {
      // 显示图表容器
  document.querySelector('.chart-container').style.display = 'flex';
      if (currentInfoWindow) {
        currentInfoWindow.close(); // 关闭当前的信息窗口
      }

      // Clear the content of chart_div2 when a new marker is clicked
      document.getElementById('chart_div2').innerHTML = '';

      infowindow.open({
        anchor: marker,
        map,
      });
      currentInfoWindow = infowindow;

     
       

      google.maps.event.addListener(infowindow, 'domready', () => {
        
        google.maps.event.addListener(infowindow, 'closeclick', () => {
          // 隐藏图表容器
          document.querySelector('.chart-container').style.display = 'none';
        });

        document.getElementById("btnLoadData").addEventListener("click", () => {
          const inputDate = document.getElementById("inputDate").value;
          if (inputDate) {
            fetch("/occupancy2/" + marker.station_number + "/" + inputDate)
              .then(response => response.json())
              .then(data => {
                data = JSON.parse(data.data);
                const dataTable = new google.visualization.DataTable();

                dataTable.addColumn('string', 'Time of Day'); // 更改此处
                dataTable.addColumn('number', 'Available Bikes');

                data.forEach(row => {
                  const date = new Date(row[0]);
                  const hour = date.getHours();
                  const hourLabel = hour.toString().padStart(2, '0') + ":00";
                  dataTable.addRow([hourLabel, row[1]]);
                });

                const options = {
                  title: 'This Station Available Bikes per Hour on ' + inputDate,
                  legend: 'none',
                  colors: ['#32CD32'],
                  hAxis: {
                    title: 'Time of Day',
                    slantedText: true,
                    slantedTextAngle: 45,
                    ticks: generateHourlyTicks()
                  },
                  vAxis: {
                    title: 'Number of Bikes'
                  },
                  animation: {
                    duration: 2000,
                    easing: "out",
                    startup: true,
                  }
                };
                const chart = new google.visualization.ColumnChart(document.getElementById('chart_div2'));
                chart.draw(dataTable, options);
              })
              .catch(error => console.log(error));
          } else {
            alert("Please enter a valid date.");
          }
        });
        
      });



      fetch("/occupancy/" + marker.station_number)
        .then(response => response.json())
        .then(data => {
          data = JSON.parse(data.data);
          const dataTable = new google.visualization.DataTable();
          var hAxisLabels = ["Mon", "Tues", "Wed", "Thrus", "Fri", "Sat", "Sun"];

          dataTable.addColumn('datetime', 'Time of Day');
          dataTable.addColumn('number', 'available_bikes');
          data.forEach(row => {
            dataTable.addRow([new Date(row[0]), row[1]]);
          });
          const options = {
            title: 'This Station Average Bikes Available Per Day',
            legend: 'none',
            colors: ['#FFA500'], // 添加此行以设置橙黄色
            hAxis: {
              title: 'Day',
              format: 'M/d',
              gridlines: {
                count: 8, // 包括起始和結束日期，共顯示8個網格線
              },
              ticks: data.map(row => new Date(row[0])), // 創建一個日期數組作為橫坐標的刻度
              baselineColor: 'Transparent'
            },
            vAxis: {
              title: 'Number of Bikes'
            },
            animation: {
              duration: 2000,
              easing: "out",
              startup: true,
            }


          };
          const chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
          chart.draw(dataTable, options);
        })
        .catch(error => console.log(error));

    });

  }

  
}


function generateHourlyTicks() {
  const ticks = [];
  for (let i = 0; i < 24; i++) {
    const hourLabel = i.toString().padStart(2, '0') + ":00";
    ticks.push({ v: hourLabel, f: hourLabel }); // 修改此行
  }
  return ticks;
}
// This example displays a marker at the center of Australia.
// When the user clicks the marker, an info window opens.


function drawHeatmap(stations) {
  const heatmapData = stations.map((station) => ({
    location: new google.maps.LatLng(station.position_lat, station.position_lng),
    weight: station.available_bikes,
  }));

  heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    map: null,
  });
  var gradient = ['rgba(102, 204, 0, 0)', 'rgba(102, 204, 0, 1)', 'rgba(187, 255, 0, 1)', 'rgba(255, 238, 0, 1)', 'rgba(255, 153, 0, 1)', 'rgba(255, 102, 0, 1)',];

  heatmap.set("radius", 60); // 确保在这里设置正确的半径
  heatmap.set("opacity", 0.6); // 调整这个值以改变不透明度
  heatmap.set("gradient", gradient); // 指定一个自定义颜色渐变
}


function toggleHeatmap(checked) {
  if (checked) {
    let opacity = 0;
    heatmap.setMap(map);

    const fadeIn = setInterval(() => {
      opacity += 0.05;
      heatmap.set("opacity", opacity);

      if (opacity >= 0.6) {
        clearInterval(fadeIn);
      }
    }, 100);
  } else {
    let opacity = 0.6;

    const fadeOut = setInterval(() => {
      opacity -= 0.05;
      heatmap.set("opacity", opacity);

      if (opacity <= 0) {
        heatmap.setMap(null);
        clearInterval(fadeOut);
      }
    }, 100);
  }
}

document.getElementById("heatmap-toggle").addEventListener("change", (event) => {
  toggleHeatmap(event.target.checked);
});

function populateSearchBoxByNumber(stations) {
  const datalist = document.getElementById("station-numbers");

  stations.forEach((station) => {
    const option = document.createElement("option");
    //option.value = station.number;
    option.innerText = `${station.number} - ${station.name}`; // 在此处添加站点名字
    datalist.appendChild(option);
  });
}

// function toggleBikeLayer() {
//   const bikeLayerCheckbox = document.getElementById("bikeLayer");
//   if (bikeLayerCheckbox.checked) {
//     bikeLayer.setMap(map);
//     // 将地图样式设置回默认样式
//     map.setOptions({ mapId: null });
//   } else {
//     bikeLayer.setMap(null);
//     // 将地图样式设置回自定义样式
//     map.setOptions({ mapId: "60579be615b58573" });
//   }
// }






var map = null;
window.initMap = initMap;

