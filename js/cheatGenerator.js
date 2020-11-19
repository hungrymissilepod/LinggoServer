const { Chance } = require('chance');

const name = "Linggo";

function getCheatCode() {
  var date = new Date();
  console.log('date: ' + date);

  // Get day, month and year from [date] object
  var sDay = String(date.getDate()).padStart(2, '0');
  var sMonth = String(date.getMonth() + 1).padStart(2, '0'); // Pad start for when month is single digit. Instead of Jan being 1, it will be 01
  var sYear = date.getFullYear();
  
  /// Concat date string
  var sDate = `${sDay}${sMonth}${sYear}`;
  /// Convert to char array
  var charArr = Array.from(sDate);

  var chance1 = new Chance(12345); // shuffle each char in a predictible way
  charArr = chance1.shuffle(charArr);

  // Convert each char
  for (i = 0; i < charArr.length; i++) {
    charArr[i] = convertDigit(charArr[i]);
  }

  // Parse converted code to int
  var code = parseInt(charArr.join(""));
  
  // Return code
  var json = JSON.stringify({
    appName: name,
    appCode: code
});
console.log(json);
return json;
}

function convertDigit(val) {
  switch (val) {
    case '0':
      return '1';
    case '1':
      return '2';
    case '2':
      return '4';
    case '3':
      return '3';
    case '4':
      return '2';
    case '5':
      return '1';
    case '6':
      return '3';
    case '7':
      return '1';
    case '8':
      return '4';
    case '9':
      return '2';
    default:
      return '1';
  }
}

/*
1 - 0, 7, 5
2 - 1, 4, 9
3 - 3, 6
4 - 2, 8
*/

module.exports = { getCheatCode }