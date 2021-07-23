define(['jquery', 'underscore', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js', './data.js'], function ($, _, XLSX) {
  const CustomWidget = function () {
    const requiredStyles =  document.createElement('style');
    requiredStyles.innerHTML = `
      .fileHandler__label { display: block; color: #848c90; padding: 0 30px; margin: 10px 0; cursor: pointer; }
      .fileHandler__wrapper { border: 1px solid; border-radius: 4px; display: flex; align-items: center; justify-content: center; padding: 14px 0; margin: 10px 0 5px; width: 50%; 
       transition: background-color 0.4s ease-in-out, color 0.4s ease-in-out; }
      .fileHandler__text { text-align: center; color: #515e6d; }
      .fileHandler__label:active .fileHandler__wrapper { background-color: rgba(202, 202, 202, .3); }
      .fileHandler__label:active .fileHandler__text { color: #34393f; }
      .fileHandler__label input { width: 0; font-size: 0; opacity: 0; line-height: 0; }
      .fileHandler__text.excel-loading, #fileHandler__spinner { display: none; }
      #fileHandler__spinner.excel-loading { display: block; }
      .fileHandler__reference { font-size: 12px; color: #848c90; }
      input.date_field.empty { width: 100% !important; padding-left: 18px; }
      `
    document.body.appendChild(requiredStyles);

    this.callbacks = {
      render: function () {
        // прикрепляем кнопку
        const contactForm = document.querySelectorAll('.company_contacts.linked-forms-holder')[0];
        contactForm.insertAdjacentHTML('beforebegin', `
          <label class="fileHandler__label" for="fileHandler">
            Обработчик Excel
            <div class="fileHandler__wrapper">
              <p class="fileHandler__text">Выбрать файл</p>
              <svg id="fileHandler__spinner" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="33px" height="9px" viewBox="0 0 128 35" xml:space="preserve"><g><circle fill="#184c60" cx="17.5" cy="17.5" r="17.5"/><animate attributeName="opacity" dur="1800ms" begin="0s" repeatCount="indefinite" keyTimes="0;0.167;0.5;0.668;1" values="0.3;1;1;0.3;0.3"/></g><g><circle fill="#184c60" cx="110.5" cy="17.5" r="17.5"/><animate attributeName="opacity" dur="1800ms" begin="0s" repeatCount="indefinite" keyTimes="0;0.334;0.5;0.835;1" values="0.3;0.3;1;1;0.3"/></g><g><circle fill="#184c60" cx="64" cy="17.5" r="17.5"/><animate attributeName="opacity" dur="1800ms" begin="0s" repeatCount="indefinite" keyTimes="0;0.167;0.334;0.668;0.835;1" values="0.3;0.3;1;1;0.3;0.3"/></g></svg>
              <input type="file" name="fileHandler" id="fileHandler">
            </div>
            <a class="fileHandler__reference" href="https://sorp.ae/assets/files/ExcelParcer/fullTableForParcer.xlsx" target="_blank" title="Скачать пример excel таблицы">Пример заполненной таблицы</a>
          </label>
        `);
        
        const injectedInput = document.getElementById('fileHandler'),
              newCompanyForm = document.getElementById('new_company_form'),
              // Индификаторы полей из AMO, см. data.js
              fieldsFromAMO = window.fieldsFromAMO;

        const newFormHTMLFlag = document.querySelector('.company_contacts.linked-forms-holder.no-items'),
              fileSpinner = document.getElementById('fileHandler__spinner'),
              fileTextState = document.querySelector('p.fileHandler__text');

        // Счетчик ошибок и функция для отображения информации
        let errorCount = 0;
        const errorInformer = (alertInfo, consoleInfo = alertInfo) => {
          errorCount++
          alert(alertInfo);
          console.warn(consoleInfo);
        }
        
        // Чтобы лишний раз не проверять всё, вынести резервы в отдельные переменные будет логичнее
        let phoneNumbers = [], emailNumbers = [];
        Object.entries(fieldsFromAMO).forEach(el => {
          if(el[1] == 'reservedPhone') phoneNumbers.push(+el[0]);
          else if(el[1] == 'reservedEmail') emailNumbers.push(+el[0]); 
        });

        // Функция обрабатывающая excel файл
        const handleFile = e => {
          const files = e.target.files, f = files[0],
                reader = new FileReader();
          
          
          fileSpinner.classList.add('excel-loading');
          fileTextState.classList.add('excel-loading');

          reader.onload = e => {
            const data = e.target.result,
                  workbook = XLSX.read(data, {type: 'binary'});
            
            // Открывает вкладку с компанией
            newCompanyForm.classList.add("expanded");

            // Эта функция меняет значение инпута, и тригерит его чтобы сработало сохранение
            const getInputByName = (name, newValue) => { 
              if (document.getElementsByName(name)[0]) {
                document.getElementsByName(name)[0].value = newValue;  
                $(`[name='${name}']`).trigger('change'); // тригерит инпут и делает вид будто в него вписали данные
              } 
              else errorInformer(`Не могу найти поле '${name}' для контента '${newValue}', не верно указан аттрибут name AMO поля`)
              // console.log(name, newValue); //TODO Удобно для дебага
            };
          
            // Эта функция меняет значение инпута, но ловит его через data-params
            const getInputByData = (idx, newValue) => {
              let selector;
              if (phoneNumbers.includes(idx)) selector = "phone";
              else if (emailNumbers.includes(idx)) selector = "email";

              // тут логика в том что в амо первые поля вообще нельзя сдвинуть, 
              // т.е можно проверять только до пяти, а все остальное оставить компании
              // а потом собираем параметр и ловим, подставляем, тригерим
              let resultElement = `[data-params="type=${idx < 5 ? "contacts" : "companies" }&q=#q#&query_type=${selector}"]`;
              
              if (document.querySelectorAll(resultElement)[0]) {
                document.querySelectorAll(resultElement)[0].value = newValue;
                $(resultElement).trigger('change');
              } 
              else errorInformer(
                `Не могу найти ${selector} под индексом '${idx}', проверьте правильно ли указан аттрибут поля`,
                `Не могу найти '${selector}' под индексом '${idx}' для контента '${newValue}', не верно указан аттрибут name AMO поля`)
            };
          
            // Итератор пробегает таблицу - вызывает нужную подставительную функцию
            // Ответы всегда находятся в excel колоннах 'B' - поэтому мы вытаскиваем только их
            for(let i = 0; i < Object.entries(workbook.Sheets.Sheet1).length; i++) {
              let currentCellWithAnswers = workbook.Sheets.Sheet1[`B${i}`];
              if (currentCellWithAnswers === undefined) {
                continue; // это нужно чтобы убрать не нужные яйчеки, последние яйчеки часто остаются пустыми и занимают место
              } else {
                let currentCellAnswerValue = Object.entries(currentCellWithAnswers)[1][1];
                if (fieldsFromAMO[i] != undefined) {
                  // console.log(i); //TODO Удобно для дебага
                  // newFormHTMLFlag - переменная содержащая элемент, который не может находится вблизи нашей кнопки в уже существующей карточке
                  if(document.querySelector('.fileHandler__label').nextElementSibling == newFormHTMLFlag) {
                    // Ищим зарезервирумые значения
                    if (phoneNumbers.includes(i) || emailNumbers.includes(i)) getInputByData(i, currentCellAnswerValue);
                    else getInputByName(fieldsFromAMO[i], currentCellAnswerValue);
                  } 
                  // собственно тут происходит всё, если таблица не новая
                  else {
                    if (i <= 2) { // Здесь проверяем имя и название компании
                      //TODO здесь возможно нужно будет сделать обработчик имени и названия компании
                    } 
                    // Здесь проверка номеров
                    else if (phoneNumbers.includes(i)) {
                      const allPhones = document.querySelectorAll('.js-control-phone.control-phone input.text-input.control--suggest--input.js-control--suggest--input.control--suggest--input-inline.linked-form__cf.js-linked-pei');
                      // поля телефона которые нам нужны либо 1 для телефона контакта и предпоследний номер для компании
                      let currentNumber = i == 3 ? allPhones[0] : allPhones[allPhones.length - 1];
                      if (!currentNumber) {
                        errorInformer(
                          `Не могу найти селектор для номера телефона №${i}`,
                          `Не могу найти селектор для номера телефона №${i}, проверь индексы массива allPhones`
                        );
                      } else {
                        currentNumber.value = currentCellAnswerValue;
                        $(currentNumber).trigger('change');
                      }
                    } 
                    // Здесь проверка email
                    else if (emailNumbers.includes(i)) {
                      let allEmails = document.querySelectorAll('.control-wrapper input[data-type="email"]');
                      // поля телефона которые нам нужны либо 0 для почты контакта и предпоследний номер для компании
                      let currentMail =  i == 4 ? allEmails[0] : allEmails[allEmails.length - 2];
                      if (!currentMail) errorInformer(`Не могу найти селектор для почты №${i}`, `Не могу найти селектор для почты №${i}, проверь индексы массива allMails`);
                      else {
                        currentMail.value = currentCellAnswerValue;
                        $(currentMail).trigger('change');
                      }
                    }
                    // Все остальное работает отлично через обычную функцию
                    else getInputByName(fieldsFromAMO[i], currentCellAnswerValue)
                  }
                } 
                else errorInformer(`В экселе больше ячеек чем в АМО, все данные после ${Object.entries(fieldsFromAMO).length} строчки не будут учтены`, 
                'Сouldn\'t find appropriate input field for information from the table. \n It could be that there\'re missing entries inside of customFieldsNames array.')
              }
            }
            
            fileSpinner.classList.remove('excel-loading');
            fileTextState.classList.remove('excel-loading');
            fileTextState.innerText = `Файл '${f.name}' обработан ${ errorCount > 0 ? `с ${errorCount} ошибками, см. консоль` : '' }`;

            // небольшой костыль для чтобы имя компании в своей вкладке тоже появился
            $('#contact_company_input').trigger('select');
          };
          reader.readAsBinaryString(f);
        };
        
        // ждем файла
        injectedInput.addEventListener('change', handleFile, false);

        // колбек рендер и все функции внизу должны возвращать true
        return true;
      },
      init: _.bind(function () { return true; }, this),
      bind_actions: function () { return true; },
      settings: function () { return true; },
      onSave: function () { return true; }
    };
    return this;
  };
  return CustomWidget;
});