const { ParsedDate } = require('@alordash/date-parser');
const { Schedule } = require('../backend/dataBase/db');
const { isTimeType } = require('@alordash/date-parser/lib/date-cases');
const { TimeListIsEmpty } = require('../backend/timeProcessing');
const { Language, GetMonthsNames, LoadReplies } = require('./replies/replies');

/**@param {Date} date 
 * @param {Language} language 
 * @returns {String} 
 */
function FormDateStringFormat(date, language) {
   let month = date.getMonth();
   let hour = date.getHours().toString(10),
      minute = date.getMinutes().toString(10);
   if (hour.length <= 1) {
      hour = '0' + hour;
   }
   if (minute.length <= 1) {
      minute = '0' + minute;
   }
   let year = '';
   if (date.getFullYear() != new Date().getFullYear()) {
      year = ` ${date.getFullYear()} г.`;
   }
   return `${date.getDate()} ${GetMonthsNames(language)[month]} ${hour}:${minute}${year}`;
}

/**@param {Number} period_time 
 * @param {Language} language 
 * @returns {String} 
 */
function FormPeriodStringFormat(period_time, language) {
   let result = '';
   const replies = LoadReplies(language);
   const minutes = Math.floor((period_time % 3600) / 60);
   const hours = Math.floor((period_time % (24 * 3600)) / 3600);
   const days = Math.floor(period_time / (24 * 3600));
   if (minutes > 0) {
      result = `${minutes} (${replies.timeTypes.minutes}) ${result}`;
   }
   if (hours > 0) {
      result = `${hours} (${replies.timeTypes.hours}) ${result}`;
   }
   if (days > 0) {
      result = `${days} (${replies.timeTypes.dates}) ${result}`;
   }
   return result.trim();
}

/**@param {Schedule} schedule
 * @param {Number} period_time 
 * @param {Number} tz 
 * @param {Language} language 
 * @returns {String}
 */
function FormStringFormatSchedule(schedule, period_time, tz, language) {
   let target_date = new Date(schedule.target_date + tz * 1000);
   console.log(`FORMATTING target_date: ${schedule.target_date}, tz: ${tz}, will be: ${schedule.target_date + tz * 1000}`);
   let max_date = new Date(schedule.max_date + tz * 1000);
   const replies = LoadReplies(language);

   let until = '';
   let period = '';
   if (max_date.getTime() >= Date.now()) {
      until = `\r\n      ${replies.until} <b>${FormDateStringFormat(max_date, language)}</b>`;
   }
   if (period_time >= 60) {
      period = `\r\n      ${replies.everyTime} <b>${FormPeriodStringFormat(period_time, language)}</b>`;
   }
   let username = '';
   if (schedule.username != 'none') {
      username = ` (<b>${schedule.username}</b>)`;
   }
   let divider = ' ';
   if (until != '' || period != '') {
      divider = '\r\n      ';
   }
   let file = (schedule.file_id != '~' && schedule.file_id != null) ? ' 💾' : '';
   return `"${schedule.text}"${file}${username}${divider}<b>${FormDateStringFormat(target_date, language)}</b>${until}${period}`;
}

module.exports = {
   TimeListIsEmpty,
   FormDateStringFormat,
   FormPeriodStringFormat,
   FormStringFormatSchedule
}