
// variables
let enlistedSubjectsDOM;
let enlistedSubjects = [];

function extractSchedule(amisDOM)
{   
    // parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(amisDOM, 'text/html');

    setTimeout(() => {
        enlistedSubjectsDOM = doc.querySelector("#active-enlistment > div.bg-white.shadow-lg.sm\\:rounded-lg.mb-4 > table > tbody").children;

        for (let esd of enlistedSubjectsDOM)
        {
            // esd[0] contains lecture class information
            // esd[1] contains lab/recit class information
            // esd[2] contains enlistment status

            // get elements in row
            const subjectInfoDOM = esd.children;

            // skip if enlistment status is not enlisted/finalized
            if (subjectInfoDOM[2].children[0].innerHTML.trim() != "Enlisted" && subjectInfoDOM[2].children[0].innerHTML.trim() != "Finalized")
            {
                // not enlisted/finalized
                continue;
            }

            let enlistedSubject = {};

            // get lecture info
            const lectureInfoDOM = subjectInfoDOM[0].children[0];

            // extract DOM of lecture title card
            let lectureTitle = lectureInfoDOM.getElementsByTagName("button")[0].getElementsByTagName("div")[0].innerText;
            
            const splittedLecture = lectureTitle.split("-");

            // store `name`, `lecture section` and `units`
            enlistedSubject.name = splittedLecture[0].trimEnd().split("\n")[1].trimStart();
            enlistedSubject.lectureSection = splittedLecture[1].trimStart().split("\n")[0].trimEnd();
            enlistedSubject.units = parseInt(splittedLecture[1].trimStart().replace("\n", "").split("\n")[1].trimStart().split(" ")[0]);

            // extract DOM of lecture content [0] contains time and days, [1] contains faculty and location
            const lectureBody = subjectInfoDOM[0].children[0].children[1].children[0].children[0];
            
            let lectureTime = lectureBody.children[0].innerText.trim().split(": ")[1].substring(1,18);
            enlistedSubject.lectureTimeStart = lectureTime.split(" - ")[0];
            enlistedSubject.lectureTimeEnd = lectureTime.split(" - ")[1];

            let lectureDays = lectureBody.children[0].children[1].getElementsByTagName("div");
            enlistedSubject.lectureDays = [];
            for (let day of lectureDays)
            {
                Subject.lectureDays.push(day.innerText.trim());
            }

            Subject.lectureFIC = lectureBody.children[1].children[0].innerText.split(": ")[1].trim();
            Subject.lectureLocation = lectureBody.children[1].children[1].innerText.split(": ")[1].trim();

            // get laboratory info (if any)
            const labInfoDOM = subjectInfoDOM[1].children[0];
            
            // check first if lab is existent
            if (labInfoDOM.innerText.trim() !== "None")
            {
                // process lab info
                // console.log(labInfoDOM);
                Subject.laboratorySection = labInfoDOM.getElementsByTagName("button")[0].innerText.split(" - ")[1].split("\n")[0];

                // extract DOM of lecture content [0] contains time and days, [1] contains faculty and location
                const labBody = subjectInfoDOM[1].children[0].children[1].children[0].children[0];
                
                let labTime = labBody.children[0].innerText.trim().split(": ")[1].substring(1,18);
                Subject.labTimeStart = labTime.split(" - ")[0];
                Subject.labTimeEnd = labTime.split(" - ")[1];

                let labDays = labBody.children[0].children[1].getElementsByTagName("div");
                Subject.labDays = [];
                for (let day of labDays)
                {
                    Subject.labDays.push(day.innerText.trim());
                }

                Subject.labFIC = labBody.children[1].children[0].innerText.split(": ")[1].trim();
                Subject.labLocation = labBody.children[1].children[1].innerText.split(": ")[1].trim();
            }
            else
            {
                // temporary null lab/recit marker
                Subject.laboratorySection = null;
                Subject.labTimeStart = null;
                Subject.labTimeEnd = null;
                Subject.labDays = null;
                Subject.labFIC = null;
                Subject.labLocation = null;
            }

            // add subject to list
            Subjects.push(Subject);
        }

        document.getElementById("status").innerHTML = `Status: <span style="color: green; font-weight:bold;">READY</span>`;
        console.log(Subjects);
    }, 2000);
}


/**
 * 
 * @param {Date} date 
 */
function formatDate(date) {
    // return timezone compliant date
    let formattedDate = new Date(`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()+1} 01:00:00`);
    
    return formattedDate.toISOString().replace(/[-:]/g, '').split('T')[0];
}

function getRelevantScheduleData(enlistedSubjects)
{
    let jsonSchedule = [];

    for (let subject of enlistedSubjects)
    {
        // add row per day in lecture
        for (let lectureDay of subject.lectureDays)
        {
            // csvSchedule += `"${lectureDay}","${subject.lectureTimeStart}","${subject.lectureTimeEnd}","${subject.name}","${subject.lectureLocation}"\n`;
            jsonSchedule.push({
                day: lectureDay,
                startTime: subject.lectureTimeStart,
                endTime: subject.lectureTimeEnd,
                subject: subject.name,
                room: subject.lectureLocation
            });
        }
        
        // add row per day in lab/recit
        if (subject.laboratorySection != null)
           {
            for (let labDay of subject.labDays)
            {
            //    csvSchedule += `"${labDay}","${subject.labTimeStart}","${subject.labTimeEnd}","${subject.name}","${subject.labLocation}"\n`;
                jsonSchedule.push({
                    day: labDay,
                    startTime: subject.labTimeStart,
                    endTime: subject.labTimeEnd,
                    subject: `${subject.name}-${subject.laboratorySection}`,
                    room: subject.labLocation
                });
            }
        }
    }

    return jsonSchedule;
}

function getNextDayOfWeek(startDate, dayAbbr) {
    const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const targetDay = daysOfWeek.indexOf(dayAbbr);
    const startDay = startDate.getDay();
    const daysToAdd = (targetDay + 7 - startDay) % 7;
    const result = new Date(startDate);
    result.setDate(result.getDate() + daysToAdd);
    return result;
}

function getSemesterDates() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    let startDate, endDate;

    // this is currently set to A.Y. 2024-2025
    if (month >= 7 && month <= 11) { // Aug - Dec
        startDate = new Date(year, 7, 19); // August 19
        endDate = new Date(year, 11, 12); // December 12
    } else if (month >= 0 && month <= 5) { // Jan - Jun
        startDate = new Date(year+1, 0, 27); // January 27
        endDate = new Date(year, 4, 23); // May 23
    } else { // Jun - Jul
        startDate = new Date(year, 5, 16); // June 16
        endDate = new Date(year, 6, 19); // July 19
    }

    return { startDate, endDate };
}

/**
 * 
 * @param {string} day 
 */
function parseDay(day)
{
    const dayAbbreviations = {
        'SU': 'SU',
        'M': 'MO',
        'T': 'TU',
        'W': 'WE',
        'TH': 'TH',
        'F': 'FR',
        'S': 'SA',
    };

    return dayAbbreviations[day] || '';
}

const JSONToFile = (obj, filename) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

/**
 * 
 * @param {string} timeString 
 */
function parseTime(timeString)
{
    // validate time here (?) - for future implementation

    let treatedTimeString = timeString;
    treatedTimeString = treatedTimeString.replace(":", "");

    const untreatedHour = parseInt(timeString.substring(0,2));

    if (timeString.endsWith("PM") && untreatedHour != 12)
    {
        // afternoon 1PM-11:59PM
        treatedTimeString = treatedTimeString.replace("PM", "");
        let treatedHour = parseInt(treatedTimeString.substring(0,2)) + 12;
        return `${treatedHour}${treatedTimeString.substring(2,4)}00`;
    }
    else if (timeString.endsWith("AM") && untreatedHour === 12)
    {
        // midnight 12AM-12:59AM
        treatedTimeString = treatedTimeString.replace("AM", "");
        treatedTimeString += "00";
        return treatedTimeString.replace("12","00");   
    }
    else if (timeString.endsWith("PM") && untreatedHour == 12)
    {
        // lunch 12PM-12:59PM
        treatedTimeString = treatedTimeString.replace("PM", "");
        treatedTimeString += "00";
        return treatedTimeString;   
    }
    else
    {
        // morning 1AM-11:59AM
        treatedTimeString = treatedTimeString.replace("AM", "");
        treatedTimeString += "00";
        return treatedTimeString;   
    }
    
}

// initialize
async function initialize()
{
    if (location.href.startsWith("chrome-extension://") && location.href.endsWith("popup.html"))
    {

        let amisDOM;

        chrome.tabs.query({active:true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: () => {
                    console.log(window.location);
                    if (!window.location.href.startsWith("https://amis.uplb.edu.ph/student/enrollment"))
                    {
                        return false;
                    }
                    return document.documentElement.outerHTML;
                }
            }, (results) => {
                console.log(results);
                amisDOM = results[0].result;
                if (amisDOM)
                {
                    extractSchedule(amisDOM);
                } else {
                    // disable other buttons when not in AMIS.
                    const buttons = [document.getElementById("csv-dl"), document.getElementById("json-dl"), document.getElementById("gcal-dl")];
                    for (let i=0; i<buttons.length;i++)
                    {
                        buttons[i].setAttribute("disabled", "disabled");
                        buttons[i].style.setProperty("cursor", "not-allowed");
                    }
                    document.getElementById("status").innerHTML = `Status: <span style="color: red; font-weight:bold;">ERROR</span>`;
                }
            })
        });

        // convert to ICS
        document.getElementById("gcal-dl").addEventListener("click", () => {
            let schedule = getRelevantScheduleData(enlistedSubjects);

            const { startDate, endDate } = getSemesterDates();
            let icsContent = 'BEGIN:VCALENDAR\nVERSION:1.0\nPRODID:-//UPLB AMIS Schedule EXTRACTOR//EN\n';
            for (let course of schedule)
            {
                const dayAbbr = parseDay(course.day);
                const start = parseTime(course.startTime);
                const end = parseTime(course.endTime);
                const eventStart = getNextDayOfWeek(startDate, dayAbbr);
                icsContent += 'BEGIN:VEVENT\n';
                icsContent += `SUMMARY:${course.subject}\n`;
                icsContent += `RRULE:FREQ=WEEKLY;BYDAY=${dayAbbr};UNTIL=${formatDate(endDate)}T235959Z\n`; // T235959Z 
                icsContent += `DTSTART:${formatDate(eventStart)}T${start}\n`;
                icsContent += `DTEND:${formatDate(eventStart)}T${end}\n`;
                icsContent += 'END:VEVENT\n';
            }
            icsContent += 'END:VCALENDAR';
            
            const blob = new Blob([icsContent], {
                type: 'text/calendar'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `1S2425-SCHED.ics`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // convert to CSV
        document.getElementById("csv-dl").addEventListener("click", () => {
            let csvSchedule = 'Day,Start Time,End Time,Class,Location\n';

            for (let subject of enlistedSubjects)
            {
                // add row per day in lecture
                for (let lectureDay of subject.lectureDays)
                {
                    csvSchedule += `"${lectureDay}","${subject.lectureTimeStart}","${subject.lectureTimeEnd}","${subject.name}","${subject.lectureLocation}"\n`;
                }

                // add row per day in lab/recit
                if (subject.laboratorySection != null)
                {
                    for (let labDay of subject.labDays)
                    {
                        csvSchedule += `"${labDay}","${subject.labTimeStart}","${subject.labTimeEnd}","${subject.name}-${subject.laboratorySection}","${subject.labLocation}"\n`;
                    }
                }
            }

            const blob = new Blob([csvSchedule], {
                type: 'text/csv',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `1S2425-SCHED.csv`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // convert to JSON
        document.getElementById("json-dl").addEventListener("click", () => {
            let jsonSchedule = getRelevantScheduleData(enlistedSubjects);

            JSONToFile(jsonSchedule, "1S2425-SCHED");
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initialize().then(() => {
        // do something
    });
});
