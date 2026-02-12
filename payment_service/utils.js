



function formatFacture(num) {
  const padded = String(num).padStart(7, '0');
  return 'N' + padded;
}


function reverseFormatFacture(str) {


  if (!str.startsWith('N')) return parseInt(str);

  // Remove the 'N' and convert to number
  return  parseInt(str.slice(1), 10);

}

module.exports ={formatFacture, reverseFormatFacture}