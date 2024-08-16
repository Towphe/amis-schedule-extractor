



// variables
let enlistedSubjectsDOM;
let enlistedSubjects = [];

// initialize
async function initialize()
{
    if (location.href.startsWith("https://amis.uplb.edu.ph/student/enrollment"))
    {
        // log
        console.log("In AMIS Enrollment Module...");

        setTimeout(() => {
            enlistedSubjectsDOM = document.querySelector("#active-enlistment > div.bg-white.shadow-lg.sm\\:rounded-lg.mb-4 > table > tbody").children;

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
                enlistedSubject.name = splittedLecture[0].trimEnd();
                enlistedSubject.lectureSection = splittedLecture[1].trimStart().split("\n")[0];
                enlistedSubject.units = parseInt(splittedLecture[1].trimStart().split("\n")[1].split(" ")[0]);

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
                    
                    console.log(labBody);
                }
                else
                {
                    // temporary null lab/recit marker
                    console.log("Null lab/recit");
                    enlistedSubject.laboratorySection = null;
                }

                // add subject to list
                enlistedSubjects.push(enlistedSubject);
            }

        }, 2000);
    }    

    console.log(enlistedSubjects);
}

document.addEventListener('DOMContentLoaded', () => {
    initialize();
});

