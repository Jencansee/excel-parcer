// аттрибуты name от input, первые четыре строчки - системные поля (имя клиента, компании, телефон, почта)
// reserved - нужны для инпутов у которых нет статичного аттрибута name - их будет обрабатывать функция getInputByData()
window.fieldsFromAMO = {
  1: "contact[N]", 
  2: "company[NAME]",
  3: "reservedPhone",
  4: "reservedEmail", // После этого элемента можно менять местами поля
  5: "CFV[852815]", 
  6: "CFV[914236]",
  7: "CFV[914246]",
  8: "CFV[914336]", 
  9: "CFV[914534]", 
  10: "CFV[914536]", 
  11: "CFV[914540]", 
  12: "CFV[914544]",
  13: "reservedPhone", 
  14: "reservedEmail", 
  15: "CFV[852821]", 
  16: "CFV[852823]",
  17: "CFV[1014977]",
  18: "CFV[1014973]"
};

// Скрипт тестился на этой таблице (т.е 100% рабочая) - https://sorp.ae/assets/files/ExcelParcer/workingTable.xlsx