var HttpClient = function() {
  this.get = function(aUrl, aCallback) {
  var anHttpRequest = new XMLHttpRequest();
  anHttpRequest.onreadystatechange = function() { 
    if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
      aCallback(anHttpRequest.responseText);
    }
    anHttpRequest.open( "GET", aUrl, true ); 
    anHttpRequest.send( null ); 
  }
}

var tab_label_date=[];
var tab_label_month=[];
var tab_label_hour=[];
var tab_data_date=[];
var tab_data_month=[];
var tab_data_in_hour=[];

var theurl='http://192.168.0.22:3000/parse_data';
var client = new HttpClient();
client.get(theurl, function(response) { 
  var response1 = JSON.parse(response);
  init_tab_data();
  get_Data_1_Date(response1 , 28, 10 , 2018);
  console.log(tab_data_in_hour);
  console.log(tab_label_hour);
  draw_char_bar(tab_label_hour,tab_data_in_hour);
});


function init_tab_data(){
  for (var i = 0; i < 24 ; i ++){
    tab_data_in_hour.push(0);
    tab_label_hour.push(i.toString());
  }
}



function get_Data_1_Date(data , date, month , year){
  for (var i = 0 ; i <  data.length ; i ++){
    var date_data = new Date(data[i].date);
    if ( (date_data.getDate()*1 == date) &&  (date_data.getMonth()*1 == month) && (date_data.getFullYear()*1 == year) )
    {
      console.log("here");
      var a = data[i].time.split(':'); //hh:mm:ss
      tab_data_in_hour[ a[0] ] += data[i].c_in; 
    }
  }
}
function get_Data_1_Week(data, week, year){

}
function get_Data_1_Month(data, month, year){

}
function get_Data_1_Year(data, year){

}

function draw_char_bar(tab_label, tab_data){
  var ctx = document.getElementById("myChart");
  var myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: tab_label,
          datasets: [{
              label: 'Number In',
              data: tab_data,
              backgroundColor: '#6fff00',
              borderColor: '#6fff00',
              borderWidth: 1,
              pointBackgroundColor: '#6fff00'
          },
          {
              label: 'Number Out',
              data: tab_data,
              backgroundColor: '#fc8e00',
              borderColor: '#fc8e00',
              borderWidth: 1,
              pointBackgroundColor: '#fc8e00'
          }]
      },
      options: {
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero:true
                  }
              }]
          }
      }
  });
}