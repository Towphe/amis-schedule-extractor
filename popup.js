
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

            // skip if enlistment status is not enlisted
            if (subjectInfoDOM[2].children[0].innerHTML.trim() != "Enlisted")
            {
                // not enlisted
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
                enlistedSubject.lectureDays.push(day.innerText.trim());
            }

            enlistedSubject.lectureFIC = lectureBody.children[1].children[0].innerText.split(": ")[1].trim();
            enlistedSubject.lectureLocation = lectureBody.children[1].children[1].innerText.split(": ")[1].trim();

            // get laboratory info (if any)
            const labInfoDOM = subjectInfoDOM[1].children[0];
            
            // check first if lab is existent
            if (labInfoDOM.innerText.trim() !== "None")
            {
                // process lab info
                // console.log(labInfoDOM);
                enlistedSubject.laboratorySection = labInfoDOM.getElementsByTagName("button")[0].innerText.split(" - ")[1].split("\n")[0];

                // extract DOM of lecture content [0] contains time and days, [1] contains faculty and location
                const labBody = subjectInfoDOM[1].children[0].children[1].children[0].children[0];
                
                let labTime = labBody.children[0].innerText.trim().split(": ")[1].substring(1,18);
                enlistedSubject.labTimeStart = labTime.split(" - ")[0];
                enlistedSubject.labTimeEnd = labTime.split(" - ")[1];

                let labDays = labBody.children[0].children[1].getElementsByTagName("div");
                enlistedSubject.labDays = [];
                for (let day of labDays)
                {
                    enlistedSubject.labDays.push(day.innerText.trim());
                }

                enlistedSubject.labFIC = labBody.children[1].children[0].innerText.split(": ")[1].trim();
                enlistedSubject.labLocation = labBody.children[1].children[1].innerText.split(": ")[1].trim();
            }
            else
            {
                // temporary null lab/recit marker
                enlistedSubject.laboratorySection = null;
                enlistedSubject.labTimeStart = null;
                enlistedSubject.labTimeEnd = null;
                enlistedSubject.labDays = null;
                enlistedSubject.labFIC = null;
                enlistedSubject.labLocation = null;
            }

            // add subject to list
            enlistedSubjects.push(enlistedSubject);
        }
        console.log(enlistedSubjects);
    }, 2000);
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

// initialize
async function initialize()
{
    if (location.href.startsWith("chrome-extension://") && location.href.endsWith("popup.html"))
    {

        let amisDOM;

        chrome.tabs.query({active:true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: () => document.documentElement.outerHTML
            }, (results) => {
                amisDOM = results[0].result;

                extractSchedule(amisDOM);
            })
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

            console.log(csvSchedule);

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
            // console.log(JSON.stringify(enlistedSubjects));
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

            JSONToFile(jsonSchedule, "1S2425-SCHED");
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initialize().then(() => {
        // do something
    });
});