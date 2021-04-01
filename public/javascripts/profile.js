console.log(orders1);
var date0 = new Date(Date.now());
var date = new Date(Date.now());
console.log(date);
date.setDate(date.getDate() + 2);
console.log(date);
for (let i = 0; i < orders1.length; i++) {
  var date2 = new Date(orders1[i].date);
  var date3 = date2.setDate(date2.getDate() + 2);

  if (date2 < date && date3 > date0) {
    console.log(1111);
    document.getElementById(`completed-${i}`).style.display = "none";
    document.getElementById(`cancel-${i}`).style.display = "block";
  }
}
