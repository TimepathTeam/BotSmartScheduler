const { ParsedDate, TimeList } = require('@alordash/date-parser');
const { isTimeType } = require('@alordash/date-parser/lib/date-cases');

/**@param {TimeList} tl 
 * @returns {TimeList} 
 */
function FillMinutes(tl) {
   if (typeof (tl.hours) != 'undefined'
      && typeof (tl.minutes) == 'undefined'
      && !tl.isOffset) {
      tl.minutes = 0;
   }
   return tl;
}

/**@param {TimeList} tl 
 * @param {Date} date 
 * @returns {TimeList} 
 */
function TimeListFromDate(tl, date) {
   tl.dates = date.getDate();
   tl.hours = date.getHours();
   tl.minutes = date.getMinutes();
   tl.months = date.getMonth();
   tl.seconds = 0;
   tl.years = date.getFullYear();
   return tl;
}

/**
 * @param {TimeList} timeList 
 * @returns {Boolean} 
 */
function TimeListIsEmpty(timeList) {
   return typeof (timeList.years) == 'undefined'
      && typeof (timeList.months) == 'undefined'
      && typeof (timeList.dates) == 'undefined'
      && typeof (timeList.hours) == 'undefined'
      && typeof (timeList.minutes) == 'undefined';
}

/**@param {TimeList} source 
 * @param {TimeList} destination 
 * @returns {TimeList} 
 */
function CopyTimeList(source, destination) {
   for (const timeProperty in source) {
      if (isTimeType(timeProperty)
         && typeof (destination[timeProperty]) == 'undefined') {
         destination[timeProperty] = source[timeProperty];
      }
   }
   return destination;
}

/**@param {TimeList} source 
 * @param {TimeList} destination 
 * @returns {TimeList} 
 */
function SetTimeList(source, destination) {
   for (const timeProperty in source) {
      if (isTimeType(timeProperty)
         && typeof (source[timeProperty]) == 'number') {
         destination[timeProperty] = source[timeProperty];
      }
   }
   return destination;
}

/**@param {TimeList} source 
 * @param {TimeList} destination 
 * @returns {TimeList} 
 */
function AddTimeList(source, destination) {
   for (const timeProperty in source) {
      if (isTimeType(timeProperty)
         && typeof (source[timeProperty]) == 'number') {
         destination[timeProperty] += source[timeProperty];
      }
   }
   return destination;
}

/**
 * @param {TimeList} timeList 
 * @param {Number} timeListDate 
 * @returns {TimeList} 
 */
function UpdateTime(timeList, timeListDate) {
   const now = new Date();
   const tsNow = now.getTime().div(1000);
   if (timeListDate < tsNow) {
      if (timeListDate + 12 * 3600 > tsNow && timeList.hours <= 12 && !timeList.isFixed) {
         timeList.hours = (timeList.hours + 12) % 24;
         timeListDate += 12 * 3600;
      } else {
         let dif = tsNow - timeListDate;
         let difInDate = new Date(tsNow * 1000 + dif * 1000);
         let monthDif = now.getUTCMonth() - difInDate.getUTCMonth();
         let yearDif = now.getUTCFullYear() - difInDate.getUTCFullYear();
         dif = dif.div(60);
         if (dif < 60 && typeof (timeList.hours) == 'undefined') {
            timeList.hours = now.getUTCHours() + 1;
         } else if (dif < 1440 && typeof (timeList.dates) == 'undefined') {
            timeList.dates = now.getUTCDate() + 1;
         } else if (monthDif < 1 && yearDif == 0 && typeof (timeList.months) == 'undefined') {
            timeList.months = now.getUTCMonth() + 1;
         } else if (yearDif < 1 && typeof (timeList.years) == 'undefined') {
            timeList.years = now.getUTCFullYear() + 1;
         } else {
            return undefined;
         }
      }
   }
   return timeList;
}

/**
 * @param {ParsedDate} parsedDate 
 * @param {Number} tz 
 * @param {Boolean} requireHours 
 * @returns {{target_date: Number, period_time: Number, max_date: Number}}
 */
function ProcessParsedDate(parsedDate, tz, requireHours) {
   if (requireHours
      && TimeListIsEmpty(parsedDate.max_date)
      && TimeListIsEmpty(parsedDate.period_time)) {
      if (typeof (parsedDate.target_date.hours) == 'undefined'
         && typeof (parsedDate.target_date.minutes) == 'undefined') {
         return undefined;
      }
   }
   let dateValues = parsedDate.valueOf();
   let target_date = dateValues.target_date.getTime().div(1000);
   let period_time = dateValues.period_time.getTime().div(1000);
   let max_date;
   const hours = Math.floor(tz / 3600);
   const minutes = Math.floor((tz % 3600) / 60);
   console.log('hours :>> ', hours);
   console.log('minutes :>> ', minutes);
   parsedDate.target_date = FillMinutes(parsedDate.target_date);
   parsedDate.max_date = FillMinutes(parsedDate.max_date);
   if (TimeListIsEmpty(parsedDate.target_date) && !TimeListIsEmpty(parsedDate.period_time)) {
      parsedDate.target_date = TimeListFromDate(parsedDate.target_date, dateValues.target_date);
      parsedDate.target_date = AddTimeList(parsedDate.period_time, parsedDate.target_date);
      parsedDate.target_date.isOffset = true;
      target_date += period_time;
   } else if (TimeListIsEmpty(parsedDate.target_date) && !TimeListIsEmpty(parsedDate.max_date)) {
      parsedDate.target_date = SetTimeList(parsedDate.max_date, parsedDate.target_date);
      target_date = dateValues.target_date.getTime().div(1000);
   }
   if (!parsedDate.target_date.isOffset) {
      console.log(`target_date is not offset, target_date :>> ${target_date}, will be: ${target_date - tz}, tz: ${tz}`);
      let curTL = TimeListFromDate(new TimeList(), dateValues.target_date);
      if (typeof (parsedDate.target_date.hours) == 'undefined') {
         parsedDate.target_date.hours = curTL.hours;
      }
      if (typeof (parsedDate.target_date.minutes) == 'undefined') {
         parsedDate.target_date.minutes = curTL.minutes;
      }
      parsedDate.target_date.hours -= hours;
      parsedDate.target_date.minutes -= minutes;
      target_date -= tz;
   }
   parsedDate.target_date = UpdateTime(parsedDate.target_date, target_date);
   if (!TimeListIsEmpty(parsedDate.max_date)) {
      parsedDate.max_date = CopyTimeList(parsedDate.target_date, parsedDate.max_date);
      max_date = parsedDate.valueOf().max_date.getTime().div(1000);
      if (!parsedDate.max_date.isOffset) {
         console.log(`max_date is not offset, max_date :>> ${max_date}, will be: ${max_date - tz}, tz: ${tz}`);
         parsedDate.max_date.hours -= hours;
         parsedDate.max_date.minutes -= minutes;
         max_date -= tz;
      }
      parsedDate.max_date = UpdateTime(parsedDate.max_date, max_date);
   } else {
      let zeroDate = new Date(0);
      parsedDate.max_date = TimeListFromDate(parsedDate.max_date, zeroDate);
   }
   if (typeof (parsedDate.target_date) == 'undefined') {
      return undefined;
   }
   dateValues = parsedDate.valueOf();
   dateValues.target_date.setSeconds(0, 0);
   dateValues.period_time.setSeconds(0, 0);
   dateValues.max_date.setSeconds(0, 0);
   target_date = dateValues.target_date.getTime();
   period_time = dateValues.period_time.getTime();
   max_date = dateValues.max_date.getTime();
   return {
      target_date,
      period_time,
      max_date
   }
}

module.exports = {
   TimeListFromDate,
   TimeListIsEmpty,
   UpdateTime,
   ProcessParsedDate
}