const express = require("express");
const router = express.Router();
const {
  Document,
  Packer,
  HeadingLevel,
  Paragraph,
  TextRun,
  AlignmentType,
  TextUnderlineType,
} = require("docx");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const JSZip = require("jszip");

router.get("/", (req, res) => res.send("GenerateDocFile!"));

router.post("/", async (req, res) => {
  const TitleParagraph = (value) => {
    return new Paragraph({
      text: value,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      textRun: {
        bold: true,
        size: 45,
      },
    });
  };

  const questionParagraph = (question) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: question,
          size: 30,
        }),
      ],
    });
  };

  const ScoreCalculate = (value) => {
    let scorelevel = "";
    switch (true) {
      case value >= 0 && value <= 4:
        scorelevel = "none";
        break;
      case value >= 5 && value <= 9:
        scorelevel = "mild";
        break;
      case value >= 10 && value <= 14:
        scorelevel = "moderate";
        break;
      case value >= 15 && value <= 19:
        scorelevel = "mod-severe";
        break;
      case value >= 20:
        scorelevel = "severe";
        break;
      default:
        break;
    }
    return scorelevel;
  };

  const answerParagraph = (answer) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: answer,
          size: 25,
          color: "#119795",
        }),
      ],
    });
  };

  const cardFieldType = (value) => {
    return value.map((item) => `${item.condition}:${item.effect}`).join(", ");
  };

  const objectCardType = (value) => {
    return value
      .map((item) => `${Object.keys(item)}: ${item[Object.keys(item)]}`)
      .join(", ");
  };

  const storyParagraph = (value) => {
    const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);

    return new Paragraph({
      children: [
        new TextRun({
          text: capitalizedValue,
          size: 30,
        }),
      ],
    });
  };

  const shePreferPronoun =
    req.body.demographicInformation.radioPreferPronounItem === "She/her/hers" ||
    req.body.demographicInformation.radioPreferPronounItem === "Ze" ||
    req.body.demographicInformation.radioPreferPronounItem === "Hir";
  const validateBoolean = (value) => {
    let isValid = false;
    if (value === "Yes") {
      isValid = true;
    } else {
      isValid = false;
    }
    return isValid;
  };

  const socialLife = (value) => {
    let life = "";
    switch (value) {
      case "I was social as a child with many friends":
        life = "was social as a child with many friends";
        break;
      case "I prefered to spend time alone and had few friends":
        life = "prefered to spend time alone and had few friends";
        break;
      case "I had several close friends but also spent time alone as a child":
        life = "had several close friends but also spent time alone as a child";
        break;
      default:
        break;
    }
    return life;
  };

  const manPronoun = shePreferPronoun ? "herself" : "himself";
  const pronounPrefer = shePreferPronoun ? "she" : "he";
  const pronoun = shePreferPronoun ? "her" : "his";

  const prepositionPronoun = shePreferPronoun ? "her" : "him";

  const doc = new Document({
    sections: [
      {
        children: [
          TitleParagraph("Demographic Information, Part I"),
          questionParagraph("1. What is your full name?"),
          answerParagraph(`${req.body.demographicInformation.fullName}`),
          questionParagraph("2. What is your date of birth?"),
          answerParagraph(`${req.body.demographicInformation.birth}`),
          questionParagraph(
            "3. Please select any of the following that represent your race or ethnicity. You may select more than one."
          ),
          answerParagraph(
            `${req.body.demographicInformation.checkedEthnicityItems}`
          ),
          questionParagraph("4. What sex was assigned to you at birth?"),
          answerParagraph(`${req.body.demographicInformation.radioSexItem}`),
          req.body.demographicInformation.radioSexItem === "Female"
            ? questionParagraph(
                "Are you pregnant, planning on getting pregnant, or breastfeeding?"
              )
            : undefined,
          req.body.demographicInformation.radioSexItem === "Female"
            ? answerParagraph(`${req.body.demographicInformation.pregnant}`)
            : undefined,
          questionParagraph("5. What pronoun do you currently prefer?"),
          answerParagraph(
            `${req.body.demographicInformation.radioPreferPronounItem}`
          ),
          questionParagraph("6. What is your marital status?"),
          answerParagraph(
            `${req.body.demographicInformation.maritalStatusItems}`
          ),
          questionParagraph("7. What is your email?"),
          answerParagraph(`${req.body.demographicInformation.email}`),
          questionParagraph("8. What is your phone number?"),
          answerParagraph(`${req.body.demographicInformation.phoneNumber}`),

          TitleParagraph(
            "Employment Where the Physical or Emotional Injury Occurred"
          ),
          questionParagraph("9. Name of Current Employer:"),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.currentEmployerName}`
          ),
          questionParagraph("10. Nature of Business:"),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.businessNature}`
          ),
          questionParagraph("11. Date This Job Began:"),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.jobBeganDate}`
          ),
          questionParagraph(
            "12. What was the last day you worked at this job?"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.jobLastDate}`
          ),
          questionParagraph(
            "13. Your Job Title When You Started This Employment:"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.startedJobTitle}`
          ),
          questionParagraph(
            "14. Your Current Title or Title When You Ended This Employment:"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.currentTitle}`
          ),
          questionParagraph("15. Your Employment Duties:"),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.employmentDuty}`
          ),
          questionParagraph(
            "16. Your Typical Work Schedule (Hours Worked Per Day, Week, or Month):"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.typicalWorkSchedule}`
          ),
          questionParagraph("17. Your Salary:"),
          answerParagraph(`${req.body.employmentInjuryPhysicalValue.salary}`),
          questionParagraph("Hourly Rate:"),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.hourlyRate}`
          ),
          questionParagraph("Do you receive overtime pay?"),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.receiveOvertimePay}`
          ),
          req.body.employmentInjuryPhysicalValue.receiveOvertimePay === "Yes"
            ? questionParagraph(
                "How much overtime pay do you typically receive?"
              )
            : undefined,
          req.body.employmentInjuryPhysicalValue.receiveOvertimePay === "Yes"
            ? answerParagraph(
                `${req.body.employmentInjuryPhysicalValue.overtimeRate}`
              )
            : undefined,
          questionParagraph("18. What Do You Like About This Job?"),
          answerParagraph(`${req.body.employmentInjuryPhysicalValue.likeJob}`),
          questionParagraph("19. What Do You Not Like About This Job?"),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.notLikeJob}`
          ),
          questionParagraph(
            "20. BEFORE The Injury, Were You Being Treated for Any Physical or Medical Condition(s)?"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.radioPhysicalConditionBeforeInjuryItem}`
          ),
          questionParagraph(
            "21. BEFORE The Injury, Were You Being Treated for Any Mental or Emotional Condition(s)?"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.radioMentalConditionBeforeInjuryItem}`
          ),
          questionParagraph(
            "22. BEFORE The Injury, Were You Experiencing Any Emotional Symptoms?"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.radioEmotionalSymptomsBeforeInjuryItem}`
          ),
          questionParagraph(
            "23. Describe These Medical or Emotional Conditions or Symptoms BEFORE The Injury:"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.describeMedicalCondition}`
          ),
          questionParagraph(
            "24. Were you taking any Medications BEFORE The Injury?"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.radioMedicationsBeforeInjuryItem}`
          ),
          questionParagraph(
            "25. What Medications Were You Taking BEFORE The Injury?"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.radioMedicationsNameBeforeInjuryItem}`
          ),
          questionParagraph(
            "26. Date of Your Injury (if more than one, list each):"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.injuryDate}`
          ),
          questionParagraph(
            "27. Describe the Injury That Occurred (provide as many details as you can):"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.describeInjuryOccurred}`
          ),
          questionParagraph(
            "28. Do You Currently Receive Disability In Connection With Your Claim?"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.radioDisabilityConnectionClaimItem}`
          ),
          req.body.employmentInjuryPhysicalValue
            .radioDisabilityConnectionClaimItem === "Yes"
            ? questionParagraph("If Yes, Which Current Disability:")
            : undefined,
          req.body.employmentInjuryPhysicalValue
            .radioDisabilityConnectionClaimItem === "Yes"
            ? answerParagraph(
                `${req.body.employmentInjuryPhysicalValue.currentDisability}`
              )
            : undefined,
          questionParagraph(
            "29. Would You Have Continued Working If Not Injured?"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.radioContinuedWorkingItem}`
          ),
          questionParagraph("30. Are you currently working"),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.radioConflictsItem}`
          ),
          req.body.employmentInjuryPhysicalValue.radioConflictsItem === "Yes"
            ? questionParagraph(
                "How many separate conflicts have you had with others at work"
              )
            : undefined,
          req.body.employmentInjuryPhysicalValue.radioConflictsItem === "Yes"
            ? answerParagraph(
                `${req.body.employmentInjuryPhysicalValue.conflictsCount}`
              )
            : undefined,
          req.body.employmentInjuryPhysicalValue.radioConflictsItem === "Yes"
            ? questionParagraph(
                "Please List Separately and Explain Each Conflict that Occurred:"
              )
            : undefined,
          req.body.employmentInjuryPhysicalValue.radioConflictsItem === "Yes"
            ? answerParagraph(
                `${req.body.employmentInjuryPhysicalValue.eachConflicts}`
              )
            : undefined,
          req.body.employmentInjuryPhysicalValue.radioConflictsItem === "Yes"
            ? questionParagraph(
                "Please Rate the Percentage That Each of These Conflicts Caused You To Feel Upset, Out of Total of 100% (Example: Conflict #1 30%, #2 50%, #3 20%)"
              )
            : undefined,
          req.body.employmentInjuryPhysicalValue.radioConflictsItem === "Yes"
            ? answerParagraph(
                `${req.body.employmentInjuryPhysicalValue.conflictsRate}`
              )
            : undefined,
          questionParagraph(
            "32. What Was/Is Your Working Relationship Like With Management or Supervisors in General?"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.relationShipLikeManagement}`
          ),
          questionParagraph("33. Name of Your Immediate Supervisor:"),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.immediateSupervisorName}`
          ),
          questionParagraph("34. Relationship with Immediate Supervisor?"),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.relationshipImmediateSupervisor}`
          ),
          req.body.employmentInjuryPhysicalValue
            .relationshipImmediateSupervisor === "Poor"
            ? questionParagraph("Explain the reason:")
            : undefined,
          req.body.employmentInjuryPhysicalValue
            .relationshipImmediateSupervisor === "Poor"
            ? answerParagraph(
                `${req.body.employmentInjuryPhysicalValue.explainSuperVisorReason}`
              )
            : undefined,
          questionParagraph("35. How Were Your Performance Appraisals?"),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.performanceAppraisals}`
          ),
          req.body.employmentInjuryPhysicalValue.performanceAppraisals ===
          "Poor"
            ? questionParagraph(
                "29. Would You Have Continued Working If Not Injured?"
              )
            : undefined,
          req.body.employmentInjuryPhysicalValue.performanceAppraisals ===
          "Poor"
            ? answerParagraph(
                `${req.body.employmentInjuryPhysicalValue.explainPerformanceAppraisals}`
              )
            : undefined,
          questionParagraph(
            "36. Have You Ever Received Verbal or Written Warnings?"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.verbalWarning}`
          ),
          req.body.employmentInjuryPhysicalValue.verbalWarning === "Yes"
            ? questionParagraph("Describe dates and reason given:")
            : undefined,
          req.body.employmentInjuryPhysicalValue.verbalWarning === "Yes"
            ? answerParagraph(
                `${req.body.employmentInjuryPhysicalValue.verbalWarningDateReason}`
              )
            : undefined,
          questionParagraph("37. Working Relationship with Co-Workers?"),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.relationshipCoWorkers}`
          ),
          req.body.employmentInjuryPhysicalValue.relationshipCoWorkers ===
          "Poor"
            ? questionParagraph(
                "Please give the names and reasons this relationship was poor."
              )
            : undefined,
          req.body.employmentInjuryPhysicalValue.relationshipCoWorkers ===
          "Poor"
            ? answerParagraph(
                `${req.body.employmentInjuryPhysicalValue.explainRelationshipCoWorkers}`
              )
            : undefined,
          questionParagraph(
            "38. Was There a 'Last Straw' Event Near the Last Day of Work?"
          ),
          answerParagraph(
            `${req.body.employmentInjuryPhysicalValue.lastStraw}`
          ),
          req.body.employmentInjuryPhysicalValue.relationshipCoWorkers === "Yes"
            ? questionParagraph(
                "Please describe your 'Last Straw' event near the last day of your work"
              )
            : undefined,
          req.body.employmentInjuryPhysicalValue.relationshipCoWorkers === "Yes"
            ? answerParagraph(
                `${req.body.employmentInjuryPhysicalValue.explainLastStraw}`
              )
            : undefined,

          TitleParagraph("Current Employer (If Different Than Above)"),
          questionParagraph(
            "39. Do you currently work for the same employer where the above injury occurred?"
          ),
          answerParagraph(
            `${req.body.currentEmployerValue.currentlyWorkEmployerInjury}`
          ),
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Name of Current Employer:")
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body.currentEmployerValue.currentlyWorkEmployerName}`
              )
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Nature of Business:")
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body.currentEmployerValue.currentlyWorkNatureBusiness}`
              )
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Job Title:")
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body.currentEmployerValue.currentlyWorkJobTitle}`
              )
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Job Duties:")
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body.currentEmployerValue.currentlyWorkJobDuties}`
              )
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Date This Job Began:")
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body.currentEmployerValue.currentlyWorkJobBeganDate}`
              )
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? questionParagraph(
                "Your Schedule, Hours Worked Per (day, week, month):"
              )
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body.currentEmployerValue.currentlyWorkSchedule}`
              )
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Salary or Hourly rate:")
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body.currentEmployerValue.currentlyWorkSalary}`
              )
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Do you like this job?")
            : undefined,
          req.body.currentEmployerValue.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body.currentEmployerValue.currentlyWorkLikeThisJob}`
              )
            : undefined,

          TitleParagraph("Physical Injury"),
          questionParagraph(
            "40. If Your Injury Was Initially Physical, Describe the First Symptoms (Pain) You Experienced:"
          ),
          answerParagraph(`${req.body.physicalInjuryValue.firstSymptoms}`),
          questionParagraph(
            "41. If Your Injury Was Initially Physical, Describe the First Treatment You Received Following This Injury(Medical, Chiropractic, Physical Therapy PT, Injections):"
          ),
          answerParagraph(`${req.body.physicalInjuryValue.firstTreatment}`),
          questionParagraph(
            "42. If Your Injury Was Initially Physical, Describe the Rest of Your Treatment (Medical, Chiropractic, PT)"
          ),
          answerParagraph(`${req.body.physicalInjuryValue.restYourTreatment}`),
          questionParagraph(
            "43. List the Doctors You Have Seen For This Physical Injury:"
          ),
          answerParagraph(`${req.body.physicalInjuryValue.doctorsList}`),
          questionParagraph(
            "44. BEFORE The Injury, Were You Being Treated for Any Mental or Emotional Condition(s)?"
          ),
          answerParagraph(`${req.body.physicalInjuryValue.receivedSurgery}`),
          questionParagraph(
            "45. List the Surgeries You Have Received for This Physical Injury:"
          ),
          answerParagraph(`${req.body.physicalInjuryValue.surgeryList}`),
          questionParagraph(
            "46. List the Medications You Have Received for This Physical Injury:"
          ),
          answerParagraph(`${req.body.physicalInjuryValue.medicationList}`),
          questionParagraph(
            "47. Have Any of the Above Treatments Helped Relieve Your Pain?"
          ),
          answerParagraph(`${req.body.physicalInjuryValue.treatmentsHelped}`),
          questionParagraph("48. Are You Still Working?"),
          answerParagraph(`${req.body.physicalInjuryValue.stillWorking}`),
          questionParagraph("49. If Not Working, Reason for Leaving?"),
          answerParagraph(`${req.body.physicalInjuryValue.leavingReason}`),

          TitleParagraph("Chief Complaint"),
          questionParagraph(
            "50. I am most bothered on this day by the following:"
          ),
          answerParagraph(`${req.body.chiefComplaintValue.mostBothered}`),
          questionParagraph(
            "51. What emotional symptoms are you currently experiencing or recently experienced?"
          ),
          answerParagraph(
            `${req.body.chiefComplaintValue.currentlyExperiencingSymptom}`
          ),
          req.body.chiefComplaintValue.currentlyExperiencingSymptom !==
          "None of the above"
            ? questionParagraph(
                "When did this current episode of these emotional symptoms begin?"
              )
            : undefined,
          answerParagraph(`${req.body.chiefComplaintValue.currentEpisodeDate}`),
          questionParagraph(
            "52. Have you experienced any of your above emotional symptoms in response to a specific stressful event in your life?"
          ),
          answerParagraph(
            `${req.body.chiefComplaintValue.specificStressfulSymptom}`
          ),
          req.body.chiefComplaintValue.specificStressfulSymptom === "Yes"
            ? questionParagraph(
                "What was the stressful event that triggered your emotional symptoms?"
              )
            : undefined,
          req.body.chiefComplaintValue.specificStressfulSymptom === "Yes"
            ? answerParagraph(
                `${req.body.chiefComplaintValue.specificStressfulEvent}`
              )
            : undefined,
          questionParagraph(
            "53. Do you have stress from any of the following?"
          ),
          answerParagraph(`${req.body.chiefComplaintValue.stressFollowing}`),

          TitleParagraph("Longitudinal History"),
          questionParagraph(
            "54. When did this episode of your depression, anxiety, or post-trauma emotions start?"
          ),
          answerParagraph(
            `${req.body.longitudinalHistoryValue.emotionEpisodeBegan}`
          ),
          questionParagraph(
            "55. Describe the Emotional/Psychiatric Symptoms You Have Experienced"
          ),
          answerParagraph(
            `${req.body.longitudinalHistoryValue.emotionSymptom}`
          ),
          questionParagraph(
            "56. During this current or most recent symptom episode, when were your symptoms the worst?"
          ),
          answerParagraph(
            `${req.body.longitudinalHistoryValue.mostWorstSymptom}`
          ),
          questionParagraph(
            "57. Have Your Emotional Symptoms Become Worse Or Better Since They Started Or Since A Specific Date Or Event?"
          ),
          answerParagraph(
            `${req.body.longitudinalHistoryValue.emotionalSymptomBecome}`
          ),
          questionParagraph("58. How Often Do You Feel the Above Emotions?"),
          answerParagraph(`${req.body.longitudinalHistoryValue.feelEmotion}`),
          req.body.longitudinalHistoryValue.feelEmotion === "other"
            ? questionParagraph(
                "If other: Explain how often you feel the above emotions"
              )
            : undefined,
          req.body.longitudinalHistoryValue.feelEmotion === "other"
            ? answerParagraph(
                `${req.body.longitudinalHistoryValue.explainFeelEmotion}`
              )
            : undefined,
          questionParagraph(
            "59. With zero to 1 equaling no or minimal symptoms and 10 equaling the most severe symptoms possible, how would you rate your depressive, anxiety, or post trauma symptoms when they were most severe?"
          ),
          answerParagraph(
            `Depressive: ${req.body.longitudinalHistoryValue.depressiveSymptom}`
          ),
          answerParagraph(
            `Anxiety: ${req.body.longitudinalHistoryValue.anxietySymptom}`
          ),
          answerParagraph(
            `PostTrauma: ${req.body.longitudinalHistoryValue.postTraumaSymptom}`
          ),
          questionParagraph(
            "60. Currently, how do your current emotional symptoms compare to when they were most severe?"
          ),
          answerParagraph(
            `${req.body.longitudinalHistoryValue.compareEmotionalSymptom}`
          ),
          questionParagraph(
            "61. Have Your Emotional Symptoms Affected Your Ability to Do Your Job?"
          ),
          answerParagraph(
            `${req.body.longitudinalHistoryValue.symptomsAffectedJob}`
          ),
          req.body.longitudinalHistoryValue.symptomsAffectedJob === "Yes"
            ? questionParagraph(
                "Please describe your emotional symptoms have affected your ability to do your job?"
              )
            : undefined,
          req.body.longitudinalHistoryValue.symptomsAffectedJob === "Yes"
            ? answerParagraph(
                `${req.body.longitudinalHistoryValue.describeSymptomsAffectedJob}`
              )
            : undefined,

          TitleParagraph("Current Symptoms"),
          TitleParagraph("PHQ-9"),
          questionParagraph("62. Little interest or pleasure in doing things?"),
          answerParagraph(`${req.body.PHQValue.interestThing}`),
          req.body.PHQValue.interestThing !== "" &&
          req.body.PHQValue.interestThing !== "Not at all"
            ? questionParagraph(
                "If you have lost the ability to enjoy activities that were previously enjoyable, please list those activities that you used to but no longer enjoy."
              )
            : undefined,
          req.body.PHQValue.interestThing !== "" &&
          req.body.PHQValue.interestThing !== "Not at all"
            ? answerParagraph(`${req.body.PHQValue.previouslyEnjoyable}`)
            : undefined,
          questionParagraph("63. Feeling down, depressed, or hopeless?"),
          answerParagraph(`${req.body.PHQValue.feelingDepressed}`),
          req.body.PHQValue.feelingDepressed !== "" &&
          req.body.PHQValue.feelingDepressed !== "Not at all"
            ? questionParagraph(
                "If you have experienced sad or depressed mood, how long have you felt sad or depressed during this or your most recent episode?"
              )
            : undefined,
          req.body.PHQValue.feelingDepressed !== "" &&
          req.body.PHQValue.feelingDepressed !== "Not at all"
            ? answerParagraph(`${req.body.PHQValue.duringFeelingDepressed}`)
            : undefined,
          req.body.PHQValue.feelingDepressed !== "" &&
          req.body.PHQValue.feelingDepressed !== "Not at all"
            ? questionParagraph(
                "Have your depressive symptoms improved or become worse since they started?"
              )
            : undefined,
          req.body.PHQValue.feelingDepressed !== "" &&
          req.body.PHQValue.feelingDepressed !== "Not at all"
            ? answerParagraph(`${req.body.PHQValue.depressiveSymptomsImproved}`)
            : undefined,
          req.body.PHQValue.feelingDepressed !== "" &&
          req.body.PHQValue.feelingDepressed !== "Not at all"
            ? questionParagraph(
                "How often do you feel depressed during this or your most recent episode?"
              )
            : undefined,
          req.body.PHQValue.feelingDepressed !== "" &&
          req.body.PHQValue.feelingDepressed !== "Not at all"
            ? answerParagraph(`${req.body.PHQValue.oftenFeelDepressed}`)
            : undefined,
          req.body.PHQValue.feelingDepressed !== "" &&
          req.body.PHQValue.feelingDepressed !== "Not at all"
            ? questionParagraph(
                "When you experience depression, does it last a majority of the day for most days of the week?"
              )
            : undefined,
          req.body.PHQValue.feelingDepressed !== "" &&
          req.body.PHQValue.feelingDepressed !== "Not at all"
            ? answerParagraph(`${req.body.PHQValue.experienceDepression}`)
            : undefined,

          questionParagraph(
            "64. Trouble falling or staying asleep, or sleeping too much?"
          ),
          answerParagraph(`${req.body.PHQValue.troubleFallingAsleep}`),
          req.body.PHQValue.troubleFallingAsleep !== "" &&
          req.body.PHQValue.troubleFallingAsleep !== "Not at all"
            ? questionParagraph(
                "If you have trouble falling asleep, how long does it take you to fall asleep?"
              )
            : undefined,
          req.body.PHQValue.troubleFallingAsleep !== "" &&
          req.body.PHQValue.troubleFallingAsleep !== "Not at all"
            ? answerParagraph(`${req.body.PHQValue.fallAsleepLong}`)
            : undefined,
          req.body.PHQValue.troubleFallingAsleep !== "" &&
          req.body.PHQValue.troubleFallingAsleep !== "Not at all"
            ? questionParagraph(
                "If you have trouble staying asleep, how many times do you wake up per night?"
              )
            : undefined,
          req.body.PHQValue.troubleFallingAsleep !== "" &&
          req.body.PHQValue.troubleFallingAsleep !== "Not at all"
            ? answerParagraph(`${req.body.PHQValue.wakeUpTimess}`)
            : undefined,
          req.body.PHQValue.troubleFallingAsleep !== "" &&
          req.body.PHQValue.troubleFallingAsleep !== "Not at all"
            ? questionParagraph(
                "If trouble staying asleep, when you wake up during the night, how long do you stay awake for?"
              )
            : undefined,
          req.body.PHQValue.troubleFallingAsleep !== "" &&
          req.body.PHQValue.troubleFallingAsleep !== "Not at all"
            ? answerParagraph(`${req.body.PHQValue.stayAwakeLong}`)
            : undefined,
          req.body.PHQValue.troubleFallingAsleep !== "" &&
          req.body.PHQValue.troubleFallingAsleep !== "Not at all"
            ? questionParagraph(
                "What is the total number of hours you sleep per 24 hours?"
              )
            : undefined,
          req.body.PHQValue.troubleFallingAsleep !== "" &&
          req.body.PHQValue.troubleFallingAsleep !== "Not at all"
            ? answerParagraph(`${req.body.PHQValue.totalSleepTimes}`)
            : undefined,

          questionParagraph("65. Feeling tired or having little energy?"),
          answerParagraph(`${req.body.PHQValue.feelingEnergy}`),
          questionParagraph("66. Poor appetite or overeating?"),
          answerParagraph(`${req.body.PHQValue.poorAppetite}`),
          req.body.PHQValue.poorAppetite !== "" &&
          req.body.PHQValue.poorAppetite !== "Not at all"
            ? questionParagraph(
                "If you have gained or lost weight recently, how many pounds have you gained or lost?"
              )
            : undefined,
          req.body.PHQValue.poorAppetite !== "" &&
          req.body.PHQValue.poorAppetite !== "Not at all"
            ? answerParagraph(`${req.body.PHQValue.recentlyWeightPounds}`)
            : undefined,
          req.body.PHQValue.poorAppetite !== "" &&
          req.body.PHQValue.poorAppetite !== "Not at all"
            ? questionParagraph(
                "How long did it take you to gain or lose this weight?"
              )
            : undefined,
          req.body.PHQValue.poorAppetite !== "" &&
          req.body.PHQValue.poorAppetite !== "Not at all"
            ? answerParagraph(`${req.body.PHQValue.weightGainLostLong}`)
            : undefined,

          questionParagraph(
            "67. Feeling bad about yourself — or that you are a failure or have let yourself or your family down?"
          ),
          answerParagraph(`${req.body.PHQValue.yourselfFeelingBad}`),
          questionParagraph(
            "68. Trouble concentrating on things, such as reading the newspaper or watching television?"
          ),
          answerParagraph(`${req.body.PHQValue.troubleConCentratingThing}`),
          questionParagraph(
            "69. Moving or speaking so slowly that other people could have noticed? Or so fidgety or restless that you have been moving a lot more than usual?"
          ),
          answerParagraph(`${req.body.PHQValue.fidgetyMoving}`),
          questionParagraph(
            "70. Thoughts that you would be better off dead, or thoughts of hurting yourself in some way?"
          ),
          answerParagraph(`${req.body.PHQValue.betterOffDeadYourself}`),
          questionParagraph(
            "71. In the past month, have you wished you were dead or wished you could go to sleep and not wake up?"
          ),
          answerParagraph(`${req.body.PHQValue.deadWishWakeUp}`),
          questionParagraph(
            "72. In the past month, have you had any actual thoughts of killing yourself?"
          ),
          answerParagraph(`${req.body.PHQValue.killingYourself}`),
          req.body.PHQValue.killingYourself !== "" &&
          req.body.PHQValue.killingYourself !== "No"
            ? questionParagraph(
                "Have you been thinking about how you might kill yourself?"
              )
            : undefined,
          req.body.PHQValue.killingYourself !== "" &&
          req.body.PHQValue.killingYourself !== "No"
            ? answerParagraph(`${req.body.PHQValue.killMethod}`)
            : undefined,
          req.body.PHQValue.killingYourself !== "No" &&
          req.body.PHQValue.killMethod !== "No"
            ? questionParagraph(
                "Have you had these thoughts, and had some intention of acting on them?"
              )
            : undefined,
          req.body.PHQValue.killingYourself !== "No" &&
          req.body.PHQValue.killMethod !== "No"
            ? answerParagraph(`${req.body.PHQValue.actingIntention}`)
            : undefined,
          req.body.PHQValue.killingYourself !== "No" &&
          req.body.PHQValue.killMethod !== "No" &&
          req.body.PHQValue.actingIntention !== "No"
            ? questionParagraph(
                "Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan?"
              )
            : undefined,
          req.body.PHQValue.killingYourself !== "No" &&
          req.body.PHQValue.killMethod !== "No" &&
          req.body.PHQValue.actingIntention !== "No"
            ? answerParagraph(`${req.body.PHQValue.killIntentionCarryout}`)
            : undefined,

          questionParagraph(
            "73. Have you ever done anything, started to do anything, or prepared to do anything to end your life?"
          ),
          answerParagraph(`${req.body.PHQValue.preparedAnythingEndYourlife}`),
          questionParagraph("74. Do you have thoughts of hurting anyone else?"),
          answerParagraph(`${req.body.PHQValue.hurtingAnyone}`),
          questionParagraph(
            "75. With zero to 1 equaling no or minimal symptoms and 10 equaling the most severe symptoms possible, how do you rate your current depressive symptoms?"
          ),
          answerParagraph(`${req.body.PHQValue.currentDepressiveSymptoms}`),

          TitleParagraph("GAD-7"),
          questionParagraph("76. Feeling nervous, anxious, or on edge"),
          answerParagraph(`${req.body.GADValue.feelingNervous}`),
          req.body.GADValue.feelingNervous !== "" &&
          req.body.GADValue.feelingNervous !== "Not at all"
            ? questionParagraph(
                "How long have you felt anxious during this or your most recent episode?"
              )
            : undefined,
          req.body.GADValue.feelingNervous !== "" &&
          req.body.GADValue.feelingNervous !== "Not at all"
            ? answerParagraph(`${req.body.GADValue.feltAnxiousLong}`)
            : undefined,
          req.body.GADValue.feelingNervous !== "" &&
          req.body.GADValue.feelingNervous !== "Not at all"
            ? questionParagraph("How often do you feel anxious?")
            : undefined,
          req.body.GADValue.feelingNervous !== "" &&
          req.body.GADValue.feelingNervous !== "Not at all"
            ? answerParagraph(`${req.body.GADValue.feelAnxiousOften}`)
            : undefined,
          questionParagraph("77. Not being able to stop or control worrying"),
          answerParagraph(`${req.body.GADValue.stopControlWorring}`),
          questionParagraph("78. Worrying too much about different things"),
          answerParagraph(`${req.body.GADValue.worringDifferentThing}`),
          req.body.GADValue.worringDifferentThing !== "" &&
          req.body.GADValue.worringDifferentThing !== "Not at all"
            ? questionParagraph("What do you worry about?")
            : undefined,
          req.body.GADValue.worringDifferentThing !== "" &&
          req.body.GADValue.worringDifferentThing !== "Not at all"
            ? answerParagraph(`${req.body.GADValue.worringThing}`)
            : undefined,
          req.body.GADValue.worringDifferentThing !== "" &&
          req.body.GADValue.worringDifferentThing !== "Not at all" &&
          req.body.GADValue.worringThing === "Other"
            ? questionParagraph(
                "You selected 'other'. Please describe what you worry about."
              )
            : undefined,
          req.body.GADValue.worringDifferentThing !== "" &&
          req.body.GADValue.worringDifferentThing !== "Not at all" &&
          req.body.GADValue.worringThing === "Other"
            ? answerParagraph(`${req.body.GADValue.describeWorringThing}`)
            : undefined,
          req.body.GADValue.worringDifferentThing !== "" &&
          req.body.GADValue.worringDifferentThing !== "Not at all"
            ? questionParagraph(
                "Does anything specific make your anxiety worse?"
              )
            : undefined,
          req.body.GADValue.worringDifferentThing !== "" &&
          req.body.GADValue.worringDifferentThing !== "Not at all"
            ? answerParagraph(`${req.body.GADValue.specificAnxietyWorse}`)
            : undefined,

          questionParagraph("79. Trouble relaxing"),
          answerParagraph(`${req.body.GADValue.troubleRelaxing}`),
          questionParagraph(
            "80. Being so restless that it's hard to sit still"
          ),
          answerParagraph(`${req.body.GADValue.restlessSitHard}`),
          questionParagraph("81. Becoming easily annoyed or irritable"),
          answerParagraph(`${req.body.GADValue.easilyAnnoyed}`),
          questionParagraph(
            "82. Feeling afraid as if something awful might happen"
          ),
          answerParagraph(`${req.body.GADValue.feelingAfraidAwfulThing}`),
          questionParagraph(
            "83. With zero to 1 equaling no or minimal symptoms and 10 equaling the most severe symptoms possible, how do you rate your current anxiety symptoms?"
          ),
          answerParagraph(`${req.body.GADValue.currentAnxietySymptoms}`),
          questionParagraph(
            "84. Do you experience panic attacks, in which your heart races, you feel like you can't breathe, you shake or sweat?"
          ),
          answerParagraph(`${req.body.GADValue.panicAttacks}`),
          req.body.GADValue.panicAttacks !== "Yes"
            ? questionParagraph(
                "If you experience panic attacks, indicate the physical symptoms that occur."
              )
            : undefined,
          req.body.GADValue.panicAttacks !== "Yes"
            ? answerParagraph(`${req.body.GADValue.panicPhysicalSymptoms}`)
            : undefined,
          req.body.GADValue.panicAttacks !== "Yes"
            ? questionParagraph(
                "If you experience panic attacks, how long do they last?"
              )
            : undefined,
          req.body.GADValue.panicAttacks !== "Yes"
            ? answerParagraph(`${req.body.GADValue.panicAttacksLastLong}`)
            : undefined,
          req.body.GADValue.panicAttacks !== "Yes"
            ? questionParagraph(
                "Please list anything that triggers your panic attacks:"
              )
            : undefined,
          req.body.GADValue.panicAttacks !== "Yes"
            ? answerParagraph(`${req.body.GADValue.panicAttacksList}`)
            : undefined,
          req.body.GADValue.panicAttacks !== "Yes"
            ? questionParagraph(
                "Are your panic attacks spontaneous and unrelated to any events?"
              )
            : undefined,
          req.body.GADValue.panicAttacks !== "Yes"
            ? answerParagraph(`${req.body.GADValue.panicAttacksSpontaneous}`)
            : undefined,

          questionParagraph("85. Have you experienced past traumatic event(s)"),
          answerParagraph(`${req.body.GADValue.pastTraumaticEvents}`),
          req.body.GADValue.pastTraumaticEvents !== "Yes"
            ? questionParagraph("What traumatic event(s) did you experience?")
            : undefined,
          req.body.GADValue.pastTraumaticEvents !== "Yes"
            ? answerParagraph(`${req.body.GADValue.traumaticEventExperience}`)
            : undefined,
          req.body.GADValue.pastTraumaticEvents !== "Yes"
            ? questionParagraph(
                "If you feel comfortable, please describe your traumatic experiences:"
              )
            : undefined,
          req.body.GADValue.pastTraumaticEvents !== "Yes"
            ? answerParagraph(
                `${req.body.GADValue.describeTraumaticExperience}`
              )
            : undefined,

          TitleParagraph("PCL-5"),
          questionParagraph(
            "86. Repeated, disturbing, and unwanted memories of the stressful experience?"
          ),
          answerParagraph(`${req.body.PCLValue.stressfulExperienceMemories}`),
          questionParagraph(
            "87. Repeated, disturbing dreams of the stressful experience?"
          ),
          answerParagraph(`${req.body.PCLValue.stressfulExperience}`),
          req.body.PCLValue.stressfulExperience !== "" &&
          req.body.PCLValue.stressfulExperience !== "Not at all"
            ? questionParagraph("These disturbing dreams occur")
            : undefined,
          req.body.PCLValue.stressfulExperience !== "" &&
          req.body.PCLValue.stressfulExperience !== "Not at all"
            ? answerParagraph(`${req.body.PCLValue.disturbingDreamsOccur}`)
            : undefined,
          questionParagraph(
            "88. Suddenly feeling or acting as if the stressful experience were actually happening again (as if you were actually back there reliving it)?"
          ),
          answerParagraph(`${req.body.PCLValue.suddenlyStressfulExperience}`),
          questionParagraph(
            "89. Feeling very upset when something reminded you of the stressful experience?"
          ),
          answerParagraph(`${req.body.PCLValue.veryUpsetStressfulExperience}`),
          questionParagraph(
            "90. Having strong physical reactions when something reminded you of the stressful experience (for example, heart pounding, trouble breathing, sweating)?"
          ),
          answerParagraph(
            `${req.body.PCLValue.strongPhysicalReactionStressfulExperience}`
          ),
          questionParagraph(
            "91. Avoiding memories, thoughts, or feelings related to the stressful experience?"
          ),
          answerParagraph(`${req.body.PCLValue.avoidingMemories}`),
          questionParagraph(
            "92. Avoiding external reminders of the stressful experience (for example, people, places, conversations, activities, objects, or situations)?"
          ),
          answerParagraph(`${req.body.PCLValue.avoidingExternalReminders}`),
          req.body.PCLValue.avoidingExternalReminders !== "" &&
          req.body.PCLValue.avoidingExternalReminders !== "Not at all"
            ? questionParagraph(
                "Please describe the people, places, conversations, objects, or situations you avoid:"
              )
            : undefined,
          req.body.PCLValue.avoidingExternalReminders !== "" &&
          req.body.PCLValue.avoidingExternalReminders !== "Not at all"
            ? answerParagraph(`${req.body.PCLValue.describeSituations}`)
            : undefined,
          req.body.PCLValue.avoidingExternalReminders !== "" &&
          req.body.PCLValue.avoidingExternalReminders !== "Not at all"
            ? questionParagraph(
                "What activities do you avoid, in relation to the trauma you have experienced?"
              )
            : undefined,
          req.body.PCLValue.avoidingExternalReminders !== "" &&
          req.body.PCLValue.avoidingExternalReminders !== "Not at all"
            ? answerParagraph(`${req.body.PCLValue.avoidActivities}`)
            : undefined,
          questionParagraph(
            "93. Trouble remembering important parts of the stressful experience?"
          ),
          answerParagraph(`${req.body.PCLValue.troubleStressfulExperience}`),
          questionParagraph(
            "94. Having strong negative beliefs about yourself, other people, or the world (for example, having thoughts such as: I am bad, there is something seriously wrong with me, no one can be trusted, the world is completely dangerous)?"
          ),
          answerParagraph(`${req.body.PCLValue.strongNegativeBeliefs}`),
          questionParagraph(
            "95. Blaming yourself or someone else for the stressful experience or what happened after it?"
          ),
          answerParagraph(`${req.body.PCLValue.stressfulExperienceBlaming}`),
          questionParagraph(
            "96. Having strong negative feelings such as fear, horror, anger, guilt, or shame?"
          ),
          answerParagraph(`${req.body.PCLValue.strongNegativefeelings}`),
          questionParagraph(
            "97. Loss of interest in activities that you used to enjoy (although this is a repeat question, please answer again)?"
          ),
          answerParagraph(`${req.body.PCLValue.lossInterestActivity}`),
          questionParagraph(
            "98. Feeling distant or cut off from other people?"
          ),
          answerParagraph(`${req.body.PCLValue.feelingDistantPeople}`),
          questionParagraph(
            "99. Trouble experiencing positive feelings (for example, being unable to feel happiness or have loving feelings for people close to you)?"
          ),
          answerParagraph(
            `${req.body.PCLValue.troubleExperiencePositiveFeeling}`
          ),
          questionParagraph(
            "100. Irritable behavior, angry outbursts, or acting aggressively?"
          ),
          answerParagraph(`${req.body.PCLValue.irritableBehavior}`),
          questionParagraph(
            "101. Taking too many risks or doing things that could cause you harm?"
          ),
          answerParagraph(`${req.body.PCLValue.manyRisksThing}`),
          questionParagraph("102. Being “superalert” or watchful or on guard?"),
          answerParagraph(`${req.body.PCLValue.beingWatchful}`),
          questionParagraph("103. Feeling jumpy or easily startled?"),
          answerParagraph(`${req.body.PCLValue.easilyStartled}`),
          questionParagraph(
            "104. Having difficulty concentrating (although this is a repeat question, please answer again)?"
          ),
          answerParagraph(`${req.body.PCLValue.difficultyConcentrating}`),
          questionParagraph(
            "105. Trouble falling or staying asleep (although this is a repeat question, please answer again)?"
          ),
          answerParagraph(`${req.body.PCLValue.troubleFallingAsleep}`),
          questionParagraph(
            "106. With zero to 1 equaling no or minimal symptoms and 10 equaling the most severe symptoms possible, how do you rate your current post trauma related symptoms?"
          ),
          answerParagraph(`${req.body.PCLValue.currentRelatedSymptoms}`),

          TitleParagraph("Current Treatment"),
          questionParagraph(
            "107. Do you currently take any psychiatric medications."
          ),
          answerParagraph(
            `${req.body.currentTreatmentValue.currentlyPsychiatricMedications}`
          ),
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "Please list the name, dose, and how often you take this medication."
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                `${req.body.currentTreatmentValue.medicationList}`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "How long have you been taking this medication?"
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                `${req.body.currentTreatmentValue.medicationLong}`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "What is the reason you take these medications you listed above? Select all that apply."
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                `${req.body.currentTreatmentValue.medicationReason}`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
            "Yes" &&
          req.body.currentTreatmentValue?.medicationReason &&
          req.body.currentTreatmentValue?.medicationReason.filter(
            (item) => item === "Other"
          ).length
            ? questionParagraph(
                "Please explain the reason you take these medications you listed above."
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
            "Yes" &&
          req.body.currentTreatmentValue?.medicationReason &&
          req.body.currentTreatmentValue?.medicationReason.filter(
            (item) => item === "Other"
          ).length
            ? answerParagraph(
                `${req.body.currentTreatmentValue.describeMedicationReason}`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "The current medications you take have produced the following effects on your condition:"
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                cardFieldType(
                  req.body.currentTreatmentValue.medicationsEffectYourCondition
                )
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "Do you always take the medication as prescribed by your medical provider?"
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                `${req.body.currentTreatmentValue.medicationAsPrescribed}`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "Have you experienced any of the following side effects from your medication(s)?"
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                `${req.body.currentTreatmentValue.experiencedSideEffects}`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
            "Yes" &&
          req.body.currentTreatmentValue?.experiencedSideEffects &&
          req.body.currentTreatmentValue?.experiencedSideEffects.filter(
            (item) => item === "Other"
          ).length
            ? questionParagraph(
                "You selected 'other,' please describe your side effects here."
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
            "Yes" &&
          req.body.currentTreatmentValue?.experiencedSideEffects &&
          req.body.currentTreatmentValue?.experiencedSideEffects.filter(
            (item) => item === "Other"
          ).length
            ? answerParagraph(
                `${req.body.currentTreatmentValue.describeSideEffect}`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "Your current or most recent psychiatric medication treatment provider was (name/facility/clinic):"
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                `${req.body.currentTreatmentValue.recentTreatmentProvider}`
              )
            : undefined,

          questionParagraph(
            "108. Are you currently in psychotherapy treatment?"
          ),
          answerParagraph(
            `${req.body.currentTreatmentValue.currentlyPsychotherapyTreatment}`
          ),
          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? questionParagraph(
                "When did your most recent psychotherapy begin?"
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? answerParagraph(
                `${req.body.currentTreatmentValue.recentPsychotherapyBegin}`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? questionParagraph(
                "When was your most recent psychotherapy session?"
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? answerParagraph(
                `${req.body.currentTreatmentValue.recentPsychotherapySession}`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? questionParagraph("I attended psychotherapy sessions:")
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? answerParagraph(
                `${req.body.currentTreatmentValue.psychotherapySessionsDate}`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? questionParagraph(
                "Your current or most recent psychotherapist treatment provider was (name/facility/clinic):"
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? answerParagraph(
                `${req.body.currentTreatmentValue.psychotherapistTreatmentProvider}`
              )
            : undefined,

          TitleParagraph("Past History"),
          questionParagraph(
            "109. Have you ever previously experienced any of the following symptoms"
          ),
          answerParagraph(
            `${req.body.pastHistoryValue.previouslyExperiencedSymptom}`
          ),
          questionParagraph(
            "110. Have you ever experienced having so much energy that you do not need to sleep for several days or a week at a time?"
          ),
          answerParagraph(`${req.body.pastHistoryValue.experienceMuchEnergy}`),
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? questionParagraph(
                "During this time, if you slept fewer than 4 hours per night, how many nights did it last?"
              )
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.sleptFewer4Hours}`)
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? questionParagraph(
                "During this time of lack of sleep, how was your energy when awake?"
              )
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.lackSleepEnergy}`)
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? questionParagraph(
                "During this time did you sleep fewer than 4 hours per night for 4-7 or more consecutive nights, without feeling excessively tired?"
              )
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.sleepFewer}`)
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? questionParagraph("During this time, how was your mood?")
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.mood}`)
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes" &&
          req.body.pastHistoryValue?.mood === "Other"
            ? questionParagraph("Please describe your mood here.")
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes" &&
          req.body.pastHistoryValue?.mood === "Other"
            ? answerParagraph(`${req.body.pastHistoryValue.describeMood}`)
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? questionParagraph(
                "During this high energy time did you engage in any high-risk behaviors?"
              )
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.highEnergyTime}`)
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? questionParagraph(
                "During this time, did you drink alcohol or use any other substances?"
              )
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.alcoholSubstances}`)
            : undefined,

          questionParagraph(
            "111. Have you ever experienced any of the following?"
          ),
          answerParagraph(`${req.body.pastHistoryValue.experienceFollowing}`),
          req.body.pastHistoryValue?.experienceFollowing.length > 0
            ? questionParagraph(
                "If you have thoughts, behaviors, or rituals that are recurrent, what thoughts, behaviors, or rituals are you having?"
              )
            : undefined,
          req.body.pastHistoryValue?.experienceFollowing.length > 0
            ? answerParagraph(`${req.body.pastHistoryValue.recurrentRituals}`)
            : undefined,
          req.body.pastHistoryValue?.experienceFollowing.length > 0
            ? questionParagraph(
                "When experiencing these symptoms, were you drinking alcohol or using any substances?"
              )
            : undefined,
          req.body.pastHistoryValue?.experienceFollowing.length > 0
            ? answerParagraph(
                `${req.body.pastHistoryValue.symptomsDrinkingAlcohol}`
              )
            : undefined,

          questionParagraph(
            "112. Recently, have you been thinking about how you might harm or kill yourself?"
          ),
          answerParagraph(`${req.body.pastHistoryValue.harmKillYourSelf}`),
          questionParagraph(
            "113. Have any of your emotional symptoms (sadness, depression, anxiety) had a negative effect upon your work, school, or relationships?"
          ),
          answerParagraph(
            `${req.body.pastHistoryValue.emotionalSymptomsRelationShip}`
          ),
          questionParagraph(
            "114. If you have ever experienced symptoms of depression, when did you first feel depressed?"
          ),
          answerParagraph(`${req.body.pastHistoryValue.firstFeelDepressed}`),
          questionParagraph(
            "115. If you have ever experienced symptoms of anxiety, when did you first feel high levels of anxiety?"
          ),
          answerParagraph(`${req.body.pastHistoryValue.feelHighLevelAnxiety}`),
          questionParagraph(
            "115. If you have ever experienced symptoms of anxiety, when did you first feel high levels of anxiety?"
          ),
          answerParagraph(`${req.body.pastHistoryValue.feelHighLevelAnxiety}`),
          questionParagraph(
            "116. Have you ever been diagnosed by a healthcare provider with any of the following mental health conditions?"
          ),
          answerParagraph(`${req.body.pastHistoryValue.diagnosedMentalHealth}`),
          req.body.pastHistoryValue?.diagnosedMentalHealth &&
          req.body.pastHistoryValue?.diagnosedMentalHealth.filter(
            (item) => item === "Other"
          ).length
            ? questionParagraph(
                "Please enter your mental health conditions here."
              )
            : undefined,
          req.body.pastHistoryValue?.diagnosedMentalHealth &&
          req.body.pastHistoryValue?.diagnosedMentalHealth.filter(
            (item) => item === "Other"
          ).length
            ? answerParagraph(
                `${req.body.pastHistoryValue.describeHealthCondition}`
              )
            : undefined,

          questionParagraph(
            "117. Have you ever taken any other medications in the past for a psychiatric or mental health condition, not listed above? This may include medications that did not work well or that were discontinued for other reasons."
          ),
          answerParagraph(`${req.body.pastHistoryValue.otherMedications}`),
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "When experiencing these symptoms, were you drinking alcohol or using any substances?"
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.pastMedicationName}`)
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Please list the approximate date you started taking the medication (if applicable)"
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.pastMedicationName}`)
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Please list the approximate date you stopped taking the medication (if applicable)"
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body.pastHistoryValue.stopedMedicationDate}`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph("These past psychiatric medication produced:")
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                cardFieldType(
                  req.body.pastHistoryValue.pastPsychiatricMedication
                )
              )
            : undefined,

          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Past psychiatric medications were stopped due to:"
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body.pastHistoryValue.stopedPsychiatricMedicationsReason}`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Did a psychiatrist, psychiatric nurse practitionaer, or primacy care clinician prescribe this medication to you?"
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body.pastHistoryValue.prescribeThisMedication}`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Please list the names of your past clinician who prescribed this medication and dates you saw them."
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body.pastHistoryValue.prescribeThisMedicationNameDate}`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph("At what clinic or office did they work at?")
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.whatClinicWorked}`)
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Please list any other psychiatrists you have ever seen."
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.otherPsychiatrists}`)
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "From what date to what date did you see this psychiatrist?"
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body.pastHistoryValue.thisPsychiatristSeeDate}`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "During this psychiatric, I attended sessions with your psychiatrist?"
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body.pastHistoryValue.attendedSessionsPsychiatrist}`
              )
            : undefined,

          questionParagraph(
            "118. Have you ever previously received psychotherapy (talk therapy/counseling)?"
          ),
          answerParagraph(
            `${req.body.pastHistoryValue.previouslyReceivedPsychotherapy}`
          ),
          questionParagraph(
            "119. Have you ever been admitted to a psychiatric hospital?"
          ),
          answerParagraph(
            `${req.body.pastHistoryValue.admittedPsychiatricHospital}`
          ),
          questionParagraph(
            "120. Have you ever experienced suicidal ideation?"
          ),
          answerParagraph(`${req.body.pastHistoryValue.suicidalIdeation}`),
          questionParagraph("121. Have you ever made a suicide attempt?"),
          answerParagraph(`${req.body.pastHistoryValue.suicideAttempt}`),
          req.body.pastHistoryValue?.suicideAttempt === "Yes"
            ? questionParagraph(
                "If yes, how many times have you attempted suicide?"
              )
            : undefined,
          req.body.pastHistoryValue?.suicideAttempt === "Yes"
            ? answerParagraph(
                `${req.body.pastHistoryValue.attemptedSuicideTimes}`
              )
            : undefined,
          req.body.pastHistoryValue?.suicideAttempt === "Yes"
            ? questionParagraph(
                "How did you attempt suicide (list all methods ever used)?"
              )
            : undefined,
          req.body.pastHistoryValue?.suicideAttempt === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.suicideAllMethods}`)
            : undefined,
          req.body.pastHistoryValue?.suicideAttempt === "Yes"
            ? questionParagraph(
                "When was the most recent time you attempted suicide?"
              )
            : undefined,
          req.body.pastHistoryValue?.suicideAttempt === "Yes"
            ? answerParagraph(
                `${req.body.pastHistoryValue.attemptedSuicideDate}`
              )
            : undefined,

          questionParagraph(
            "122. Have you ever experienced any other psychiatric symptoms that are not described above"
          ),
          answerParagraph(
            `${req.body.pastHistoryValue.otherPsychiatricSymptoms}`
          ),
          req.body.pastHistoryValue?.otherPsychiatricSymptoms === "Yes"
            ? questionParagraph(
                "Please describe the psychiatric symptoms you experienced that were not previously identified above:"
              )
            : undefined,
          req.body.pastHistoryValue?.otherPsychiatricSymptoms === "Yes"
            ? answerParagraph(
                `${req.body.pastHistoryValue.describeOtherPsychiatricSymptoms}`
              )
            : undefined,

          questionParagraph(
            "123. Have you received any other psychotherapy or psychiatric medication treatment besides that described above?"
          ),
          answerParagraph(
            `${req.body.pastHistoryValue.otherPsychotherapyTreatment}`
          ),
          req.body.pastHistoryValue?.otherPsychotherapyTreatment === "Yes"
            ? questionParagraph(
                "Please describe the additional psychotherapy or psychiatric medication treatment that was not described above"
              )
            : undefined,
          req.body.pastHistoryValue?.otherPsychotherapyTreatment === "Yes"
            ? answerParagraph(
                `${req.body.pastHistoryValue.describeOtherPsychotherapyTreatment}`
              )
            : undefined,

          questionParagraph(
            "124. Have you ever been evaluated otherwise by psychiatrists or psychologists for any other purpose?"
          ),
          answerParagraph(
            `${req.body.pastHistoryValue.evaluatedOtherwisePsychiatrists}`
          ),
          req.body.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? questionParagraph(
                "Please describe the reason for this psychiatric or psychotherapy evaluation."
              )
            : undefined,
          req.body.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.evaluationReason}`)
            : undefined,
          req.body.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? questionParagraph("Who performed this evaluation?")
            : undefined,
          req.body.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? answerParagraph(
                `${req.body.pastHistoryValue.evaluationPerformed}`
              )
            : undefined,
          req.body.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? questionParagraph("When did this evaluation occur?")
            : undefined,
          req.body.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? answerParagraph(`${req.body.pastHistoryValue.evaluationOccur}`)
            : undefined,

          questionParagraph(
            "125. Have you ever been involved in physical altercations or violence?"
          ),
          answerParagraph(`${req.body.pastHistoryValue.physicalAltercations}`),
          req.body.pastHistoryValue?.physicalAltercations === "Yes"
            ? questionParagraph(
                "How many physicial altercations have you been invovled in?"
              )
            : undefined,
          req.body.pastHistoryValue?.physicalAltercations === "Yes"
            ? answerParagraph(
                `${req.body.pastHistoryValue.physicialAltercationsMany}`
              )
            : undefined,

          TitleParagraph("Substance Use"),
          questionParagraph(
            "126. Have you ever used any of the following substances?"
          ),
          answerParagraph(`${req.body.substanceUseValue.followingSubstances}`),
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "How often do you currently use each substance?"
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                cardFieldType(req.body.substanceUseValue.currentlySubstance)
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "Please list how much you use of each substance."
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                cardFieldType(req.body.substanceUseValue.eachSubstanceList)
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "Please list how old you were when you started using each substance."
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                cardFieldType(
                  req.body.substanceUseValue.eachSubstanceListStartedOld
                )
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "When did you last use each of these substances?"
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                cardFieldType(req.body.substanceUseValue.eachSubstanceLast)
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "Do you have a history of experiencing tolerance (needing more to get the same effect) from any of the following substances?"
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                cardFieldType(
                  req.body.substanceUseValue.toleranceFollowingSubstances
                )
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "Do you have a history of experiencing withdrawal symptoms from any of the following substances?"
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                cardFieldType(
                  req.body.substanceUseValue.withdrawalFollowingSubstances
                )
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "Regarding your alcohol or substance use, have you experienced any of the following (check all that apply)?"
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                `${req.body.substanceUseValue.regardingAlcoholAnyFollowing}`
              )
            : undefined,

          questionParagraph(
            "127. Have you ever enrolled in a substance recovery treatment program?"
          ),
          answerParagraph(
            `${req.body.substanceUseValue.enrolledTreatmentProgram}`
          ),
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph("Did you complete this treatment program?")
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body.substanceUseValue.completeTreatmentProgram}`
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph(
                "This treatment lasted from what date to what date?"
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph("From:")
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body.substanceUseValue.treatmentLastedDateFrom}`
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph("To:")
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body.substanceUseValue.treatmentLastedDateTo}`
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph(
                "Following this treatment you remained clean and sober for how long?"
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body.substanceUseValue.remainedTreatmentClean}`
              )
            : undefined,

          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph(
                "This clean and sober period lasted from when to when?"
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph("From:")
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body.substanceUseValue.cleanSoberLastedFrom}`
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph("To:")
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body.substanceUseValue.cleanSoberLastedTo}`
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph(
                "What is the longest that you have ever remained completely clean and sober from all alcohol and substance use?"
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body.substanceUseValue.remainedTreatmentCleanLongest}`
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph(
                "While you were clean and sober, did you continue to experience any of your previously described psychiatric symptoms, such as depression and/or anxiety?"
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body.substanceUseValue.previouslyDescribedPsychiatricClean}`
              )
            : undefined,

          TitleParagraph("Medical History"),
          questionParagraph(
            "128. Have you ever experienced having so much energy that you do not need to sleep for several days or a week at a time?"
          ),
          answerParagraph(
            `${req.body.medicalHistoryValue.diagnosedHealthcareProvider}`
          ),
          req.body.demographicInformation?.radioSexItem === "Female"
            ? questionParagraph(
                "Are you pregnant, planning on getting pregnant, or breastfeeding?"
              )
            : undefined,
          req.body.demographicInformation?.radioSexItem === "Female"
            ? answerParagraph(
                `${req.body.medicalHistoryValue.pregnantPlanning}`
              )
            : undefined,
          req.body.demographicInformation?.radioSexItem === "Female" &&
          req.body.medicalHistoryValue?.pregnantPlanning === "Yes"
            ? questionParagraph(
                "Are you currently engaged with a healthcare provider regarding your current or planned pregnancy?"
              )
            : undefined,
          req.body.demographicInformation?.radioSexItem === "Female" &&
          req.body.medicalHistoryValue?.pregnantPlanning === "Yes"
            ? answerParagraph(
                `${req.body.medicalHistoryValue.plannedPregnancyProvider}`
              )
            : undefined,

          questionParagraph(
            "129. Please list your general physical health medications, including your dosage for each medication:"
          ),
          answerParagraph(
            `${req.body.medicalHistoryValue.physicalHealthMedicationsLists}`
          ),
          questionParagraph("130. Have you ever had any surgeries?"),
          answerParagraph(`${req.body.medicalHistoryValue.surgeries}`),
          req.body.medicalHistoryValue?.surgeries === "Yes"
            ? questionParagraph(
                "Please list your previous surgeries with dates when possible."
              )
            : undefined,
          req.body.medicalHistoryValue?.surgeries === "Yes"
            ? answerParagraph(
                `${req.body.medicalHistoryValue.surgeriesDateList}`
              )
            : undefined,

          questionParagraph(
            "131. Have your general medical medications produced any side effects?"
          ),
          answerParagraph(
            `${req.body.medicalHistoryValue.medicationsSideEffect}`
          ),
          questionParagraph(
            "132. Do your treatment providers have plans for your future medical care?"
          ),
          answerParagraph(`${req.body.medicalHistoryValue.futureMedicalPlan}`),
          req.body.medicalHistoryValue?.futureMedicalPlan === "Yes"
            ? questionParagraph(
                "Please list your planned planned future medical care"
              )
            : undefined,
          req.body.medicalHistoryValue?.futureMedicalPlan === "Yes"
            ? answerParagraph(
                `${req.body.medicalHistoryValue.futureMedicalPlanList}`
              )
            : undefined,

          questionParagraph(
            "133. Current primary care physician or nurse practitioner is (Name, Facility, City):"
          ),
          answerParagraph(
            `${req.body.medicalHistoryValue.currentPrimarycarePractitioner}`
          ),
          questionParagraph(
            "134. Past primary care physician or nurse practitioners (Name, Facility, City)?"
          ),
          answerParagraph(
            `${req.body.medicalHistoryValue.pastprimarycarePractitioner}`
          ),
          questionParagraph(
            "During what time period did you receive this care from each provider?"
          ),
          answerParagraph(
            `${req.body.medicalHistoryValue.periodReceiveProvider}`
          ),
          questionParagraph(
            "135. List All of the Hospitals You Have Ever Been In For Medical Reasons (and when you were in this hospital):"
          ),
          answerParagraph(
            `${req.body.medicalHistoryValue.hospitalListEverBeen}`
          ),
          questionParagraph(
            "136. List All Of The Medications You Are Taking (Name of medication, dosage):"
          ),
          answerParagraph(
            `${req.body.medicalHistoryValue.medicationsListTaking}`
          ),
          questionParagraph(
            "137. Do you have any allergies or intolerances to medication or food?"
          ),
          answerParagraph(
            `${req.body.medicalHistoryValue.allergiesMedication}`
          ),
          req.body.medicalHistoryValue?.allergiesMedication === "Yes"
            ? questionParagraph("Please list your intolerances or allergies.")
            : undefined,
          req.body.medicalHistoryValue?.allergiesMedication === "Yes"
            ? answerParagraph(`${req.body.medicalHistoryValue.allergiesList}`)
            : undefined,

          TitleParagraph("Family History"),
          questionParagraph(
            "138. Do any of your family members suffer from the following psychiatric conditions?"
          ),
          answerParagraph(
            `${req.body.familyHistoryValue.familyPsychiatricConditions}`
          ),
          req.body.familyHistoryValue?.familyPsychiatricConditions === "Other"
            ? questionParagraph(
                "Please list any other psychiatric conditions your family members have been diagnosed with."
              )
            : undefined,
          req.body.familyHistoryValue?.familyPsychiatricConditions === "Other"
            ? answerParagraph(
                `${req.body.familyHistoryValue.psychiatricConditionsList}`
              )
            : undefined,
          req.body.familyHistoryValue?.familyPsychiatricConditions === "Other"
            ? questionParagraph(
                "If there is a family history of psychiatric conditions, please provide their treatment received, if known."
              )
            : undefined,
          req.body.familyHistoryValue?.familyPsychiatricConditions === "Other"
            ? answerParagraph(
                `${req.body.familyHistoryValue.psychiatricConditionsTreatment}`
              )
            : undefined,

          questionParagraph(
            "139. Have any of your family members attempted or committed suicide?"
          ),
          answerParagraph(
            `${req.body.familyHistoryValue.familyAttemptedSuicide}`
          ),

          TitleParagraph("Relationship History"),
          questionParagraph(
            "140. Are you currently involved in an intimate relationship?"
          ),
          answerParagraph(
            `${req.body.relationshipHistoryValue.currentlyIntimateRelationship}`
          ),
          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? questionParagraph("Are you currently married?")
            : undefined,
          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? answerParagraph(
                `${req.body.relationshipHistoryValue.currentlyMarried}`
              )
            : undefined,
          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? questionParagraph(
                "How long have you been involved in your current relationship?"
              )
            : undefined,
          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? answerParagraph(
                `${req.body.relationshipHistoryValue.currentRelationshipInvolve} ${req.body.relationshipHistoryValue?.currentlyUnit}`
              )
            : undefined,
          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? questionParagraph(
                "If yes, how would you describe your current intimate relationship?"
              )
            : undefined,
          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? answerParagraph(
                `${req.body.relationshipHistoryValue.describeIntimateRelationship}`
              )
            : undefined,
          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? questionParagraph("What Is Your Spouse or Partner's Occupation?")
            : undefined,
          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? answerParagraph(
                `${req.body.relationshipHistoryValue.PartnerOccupation}`
              )
            : undefined,

          questionParagraph("141. How many times have you been married?"),
          answerParagraph(`${req.body.relationshipHistoryValue.marriedNumber}`),
          questionParagraph(
            "142. How many long term intimate relationships have you had?"
          ),
          answerParagraph(
            `${req.body.relationshipHistoryValue.intimateRelationshipTimes}`
          ),
          questionParagraph(
            "How long did each of your long term relationships last?"
          ),
          answerParagraph(
            `${req.body.relationshipHistoryValue.longTermRelationshipsLast}`
          ),
          questionParagraph(
            "What are the reasons that your previous relationships/marriage ended?"
          ),
          answerParagraph(
            `${req.body.relationshipHistoryValue.reasonPreviousRelationships}`
          ),
          questionParagraph(
            "Has there ever been domestic violence in any of your relationships?"
          ),
          answerParagraph(
            `${req.body.relationshipHistoryValue.domesticViolence}`
          ),

          questionParagraph("143. Do you have children?"),
          answerParagraph(`${req.body.relationshipHistoryValue.haveChildren}`),
          req.body.relationshipHistoryValue?.haveChildren === "Yes"
            ? questionParagraph(
                "How many children do you have and what are their ages?"
              )
            : undefined,
          req.body.relationshipHistoryValue?.haveChildren === "Yes"
            ? answerParagraph(
                `${req.body.relationshipHistoryValue.childrenNumberAndAge}`
              )
            : undefined,
          req.body.relationshipHistoryValue?.haveChildren === "Yes"
            ? questionParagraph(
                "How are your children doing in school or work?"
              )
            : undefined,
          req.body.relationshipHistoryValue?.haveChildren === "Yes"
            ? answerParagraph(
                `${req.body.relationshipHistoryValue.childrenDoingSchool}`
              )
            : undefined,
          req.body.relationshipHistoryValue?.haveChildren === "Yes"
            ? questionParagraph(
                "What is your relationship like with your children?"
              )
            : undefined,
          req.body.relationshipHistoryValue?.haveChildren === "Yes"
            ? answerParagraph(
                `${req.body.relationshipHistoryValue.relationshipChildren}`
              )
            : undefined,
          req.body.relationshipHistoryValue?.haveChildren === "Yes"
            ? questionParagraph(
                "Do any of your children have any general or mental health issues?"
              )
            : undefined,
          req.body.relationshipHistoryValue?.haveChildren === "Yes"
            ? answerParagraph(
                `${req.body.relationshipHistoryValue.childrenHealthIssues}`
              )
            : undefined,

          TitleParagraph("Employment History"),
          questionParagraph("144. What is your current employment status?"),
          answerParagraph(
            `${req.body.employmentHistoryValue.currentEmploymentStatus}`
          ),
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed <20 hours per week" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed >20 hours per week, but not full time" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed full time"
            ? questionParagraph("What is the name of your employer?")
            : undefined,
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed <20 hours per week" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed >20 hours per week, but not full time" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed full time"
            ? answerParagraph(`${req.body.employmentHistoryValue.employerName}`)
            : undefined,
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed <20 hours per week" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed >20 hours per week, but not full time" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed full time"
            ? questionParagraph(
                "What is your employment title at this position?"
              )
            : undefined,
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed <20 hours per week" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed >20 hours per week, but not full time" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed full time"
            ? answerParagraph(
                `${req.body.employmentHistoryValue.employmentTitle}`
              )
            : undefined,
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed <20 hours per week" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed >20 hours per week, but not full time" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed full time"
            ? questionParagraph("What are your job duties?")
            : undefined,
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed <20 hours per week" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed >20 hours per week, but not full time" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed full time"
            ? answerParagraph(`${req.body.employmentHistoryValue.jobDuties}`)
            : undefined,
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed <20 hours per week" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed >20 hours per week, but not full time" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed full time"
            ? questionParagraph(
                "Are you having any difficulty performing your job duties?"
              )
            : undefined,
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed <20 hours per week" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed >20 hours per week, but not full time" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed full time"
            ? answerParagraph(
                `${req.body.employmentHistoryValue.difficultyJobDuties}`
              )
            : undefined,

          questionParagraph(
            "145. What is the name of your past employer immediately prior to any current job you may have?"
          ),
          answerParagraph(
            `${req.body.employmentHistoryValue.pastEmployerName}`
          ),
          questionParagraph("What was your job title at this position?"),
          answerParagraph(`${req.body.employmentHistoryValue.jobTitle}`),
          questionParagraph("When did you began this past employment"),
          answerParagraph(
            `${req.body.employmentHistoryValue.pastEmploymentBegan}`
          ),
          questionParagraph("When did you end this past employment position?"),
          answerParagraph(
            `${req.body.employmentHistoryValue.pastEmploymentEnd}`
          ),
          questionParagraph("What was the reason this employment ended?"),
          answerParagraph(
            `${req.body.employmentHistoryValue.pastEmploymentEndReason}`
          ),

          questionParagraph(
            "146. What is the name of your past employer immediately prior to the job described above?"
          ),
          answerParagraph(
            `${req.body.employmentHistoryValue.pastImmediatelyEmployerName}`
          ),
          questionParagraph("147. Have you had any past workplace injuries?"),
          answerParagraph(
            `${req.body.employmentHistoryValue.pastWorkplaceInjuries}`
          ),
          req.body.employmentHistoryValue?.pastWorkplaceInjuries === "Yes"
            ? questionParagraph("When did this or these injuries occur?")
            : undefined,
          req.body.employmentHistoryValue?.pastWorkplaceInjuries === "Yes"
            ? answerParagraph(
                `${req.body.employmentHistoryValue.injuriesOccurTime}`
              )
            : undefined,
          req.body.employmentHistoryValue?.pastWorkplaceInjuries === "Yes"
            ? questionParagraph(
                "What as the nature of this injury or injuries?"
              )
            : undefined,
          req.body.employmentHistoryValue?.pastWorkplaceInjuries === "Yes"
            ? answerParagraph(`${req.body.employmentHistoryValue.injuryNature}`)
            : undefined,

          questionParagraph(
            "148. Have you ever submitted a Workers’ Compensation claim"
          ),
          answerParagraph(
            `${req.body.employmentHistoryValue.workerCompensationClaim}`
          ),
          questionParagraph("149. Have you ever been placed on disability?"),
          answerParagraph(
            `${req.body.employmentHistoryValue.placedDisability}`
          ),
          questionParagraph(
            "150. Have you ever received negative work evaluations, been terminated from a position, or received disciplinary action?"
          ),
          answerParagraph(
            `${req.body.employmentHistoryValue.receivedNegativeWork}`
          ),
          questionParagraph("151. List All of Your Current Sources of Income."),
          answerParagraph(
            `${req.body.employmentHistoryValue.currentSourcesIncome}`
          ),
          questionParagraph(
            "152. Please describe the other employment you listed in the previous question:"
          ),
          answerParagraph(
            `${req.body.employmentHistoryValue.otherEmploymentList}`
          ),

          TitleParagraph("Education History"),
          questionParagraph("153. What is your highest level of education?"),
          answerParagraph(
            `${req.body.educationHistoryValue.highestLevelEducation}`
          ),
          req.body.educationHistoryValue?.highestLevelEducation ===
          "Currently a student"
            ? questionParagraph(
                "If you are currently enrolled in an education program, please describe:"
              )
            : undefined,
          req.body.educationHistoryValue?.highestLevelEducation ===
          "Currently a student"
            ? answerParagraph(
                `${req.body.educationHistoryValue.currentlyEnrolledEducation}`
              )
            : undefined,

          questionParagraph(
            "154. What Grades Did You Mostly Receive During Your Education (choose all that apply)?"
          ),
          answerParagraph(
            `${req.body.educationHistoryValue.mostlyReceiveGrade}`
          ),

          questionParagraph(
            "155. Were you ever identified as having a learning disability, or placed in any special education classes?"
          ),
          answerParagraph(
            `${req.body.educationHistoryValue.learningDisability}`
          ),
          req.body.educationHistoryValue?.learningDisability === "Yes"
            ? questionParagraph("Please describe your learning difficulties?")
            : undefined,
          req.body.educationHistoryValue?.learningDisability === "Yes"
            ? answerParagraph(
                `${req.body.educationHistoryValue.describeLearningDifficulties}`
              )
            : undefined,

          questionParagraph("156. Did You Graduate High School?"),
          answerParagraph(
            `${req.body.educationHistoryValue.graduateHighSchool}`
          ),
          req.body.educationHistoryValue?.graduateHighSchool === "Yes"
            ? questionParagraph("If Yes, Did You Graduate On Time?")
            : undefined,
          req.body.educationHistoryValue?.graduateHighSchool === "Yes"
            ? answerParagraph(
                `${req.body.educationHistoryValue.graduateOnTime}`
              )
            : undefined,

          questionParagraph("157. Did You Go To College"),
          answerParagraph(`${req.body.educationHistoryValue.goToCollege}`),
          req.body.educationHistoryValue?.goToCollege === "Yes"
            ? questionParagraph("if so, did you complete your degree?")
            : undefined,
          req.body.educationHistoryValue?.goToCollege === "Yes"
            ? answerParagraph(
                `${req.body.educationHistoryValue.completeYourDegree}`
              )
            : undefined,
          req.body.educationHistoryValue?.goToCollege === "Yes"
            ? questionParagraph("Name of College:")
            : undefined,
          req.body.educationHistoryValue?.goToCollege === "Yes"
            ? answerParagraph(`${req.body.educationHistoryValue.collegeName}`)
            : undefined,
          req.body.educationHistoryValue?.goToCollege === "Yes"
            ? questionParagraph("College Major or Primary Topic of Study:")
            : undefined,
          req.body.educationHistoryValue?.goToCollege === "Yes"
            ? answerParagraph(`${req.body.educationHistoryValue.collegeMajor}`)
            : undefined,

          TitleParagraph("Social History"),
          questionParagraph(
            "158. Are you experiencing any barriers to receiving healthcare?"
          ),
          answerParagraph(
            `${req.body.socialHistoryValue.barriersReceivingHealthcare}`
          ),

          req.body.socialHistoryValue?.barriersReceivingHealthcare === "Yes"
            ? questionParagraph(
                "Please select the barriers to healthcare you are experiencing:"
              )
            : undefined,
          req.body.socialHistoryValue?.barriersReceivingHealthcare === "Yes"
            ? answerParagraph(
                `${req.body.socialHistoryValue.selectbarriersHealthcare}`
              )
            : undefined,

          questionParagraph(
            "159. Please describe your current living situation(select all that apply):"
          ),
          answerParagraph(
            `${req.body.socialHistoryValue.describeCurrentLivingSituation}`
          ),
          req.body.socialHistoryValue?.describeCurrentLivingSituation.length !==
            0 &&
          req.body.socialHistoryValue?.describeCurrentLivingSituation.filter(
            (item) => item !== "Homeless" && item !== "Other"
          ).length > 0
            ? questionParagraph("Who else lives in your home with you?")
            : undefined,
          req.body.socialHistoryValue?.describeCurrentLivingSituation.length !==
            0 &&
          req.body.socialHistoryValue?.describeCurrentLivingSituation.filter(
            (item) => item !== "Homeless" && item !== "Other"
          ).length > 0
            ? answerParagraph(`${req.body.socialHistoryValue.livesYourHome}`)
            : undefined,

          req.body.socialHistoryValue?.describeCurrentLivingSituation.length !==
            0 &&
          req.body.socialHistoryValue?.describeCurrentLivingSituation.filter(
            (item) => item !== "Homeless" && item !== "Other"
          ).length > 0
            ? questionParagraph(
                "If yes, how many times have you attempted suicide?"
              )
            : undefined,
          req.body.socialHistoryValue?.describeCurrentLivingSituation.length !==
            0 &&
          req.body.socialHistoryValue?.describeCurrentLivingSituation.filter(
            (item) => item !== "Homeless" && item !== "Other"
          ).length > 0
            ? answerParagraph(
                `${req.body.socialHistoryValue.residedCurrentHomeLong}`
              )
            : undefined,
          req.body.socialHistoryValue?.describeCurrentLivingSituation.length !==
            0 &&
          req.body.socialHistoryValue?.describeCurrentLivingSituation.filter(
            (item) => item !== "Homeless" && item !== "Other"
          ).length > 0
            ? questionParagraph("Do You Own Your Home?")
            : undefined,
          req.body.socialHistoryValue?.describeCurrentLivingSituation.length !==
            0 &&
          req.body.socialHistoryValue?.describeCurrentLivingSituation.filter(
            (item) => item !== "Homeless" && item !== "Other"
          ).length > 0
            ? answerParagraph(`${req.body.socialHistoryValue.ownYourHome}`)
            : undefined,
          req.body.socialHistoryValue?.describeCurrentLivingSituation.length !==
            0 &&
          req.body.socialHistoryValue?.describeCurrentLivingSituation.filter(
            (item) => item !== "Homeless" && item !== "Other"
          ).length > 0
            ? questionParagraph(
                "Please describe the additional stressors in your life, not already covered above:"
              )
            : undefined,
          req.body.socialHistoryValue?.describeCurrentLivingSituation.length !==
            0 &&
          req.body.socialHistoryValue?.describeCurrentLivingSituation.filter(
            (item) => item !== "Homeless" && item !== "Other"
          ).length > 0
            ? answerParagraph(
                `${req.body.socialHistoryValue.describeAdditionalStressors}`
              )
            : undefined,

          questionParagraph(
            "160. Do you feel that you are in any danger at the present time?"
          ),
          answerParagraph(`${req.body.socialHistoryValue.presentTimeDanger}`),
          req.body.socialHistoryValue?.presentTimeDanger === "Yes"
            ? questionParagraph(
                "Please describe the situation in which you feel in danger."
              )
            : undefined,
          req.body.socialHistoryValue?.presentTimeDanger === "Yes"
            ? answerParagraph(
                `${req.body.socialHistoryValue.describeFeelDanger}`
              )
            : undefined,

          questionParagraph(
            "161. List ALL stressors NOT related to work which happened in the past year (i.e., separation/divorce, death in family, problems with children, financial, foreclosure, bankruptcy, repossessions, etc)."
          ),
          answerParagraph(
            `${req.body.socialHistoryValue.allStressorsPastYear}`
          ),
          questionParagraph(
            "Did these stressors affect your emotional symptoms"
          ),
          answerParagraph(`${req.body.socialHistoryValue.eachStressorsAffect}`),
          questionParagraph(
            "How did each of these stressors affect your emotional symptoms?"
          ),
          answerParagraph(`${req.body.socialHistoryValue.stressorsAffect}`),

          questionParagraph(
            "162. Since Your Injury, Have You Experienced Any Other Stressors Besides Your Injury or Psychiatric Issue?"
          ),
          answerParagraph(
            `${req.body.socialHistoryValue.otherStressorsBesides}`
          ),
          req.body.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? questionParagraph(
                "Please explain all of the stressors in your life?"
              )
            : undefined,
          req.body.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? answerParagraph(
                `${req.body.socialHistoryValue.explainAllStressors}`
              )
            : undefined,
          req.body.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? questionParagraph(
                "Did these stressors affect your emotional symptoms"
              )
            : undefined,
          req.body.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? answerParagraph(
                `${req.body.socialHistoryValue.affectEmotionalSymptoms}`
              )
            : undefined,
          req.body.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? questionParagraph(
                "How did each of these stressors affect your emotional symptoms?"
              )
            : undefined,
          req.body.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? answerParagraph(
                `${req.body.socialHistoryValue.eachAffectEmotionalSymptoms}`
              )
            : undefined,

          questionParagraph(
            "163. Are you experiencing any other stressors in your life not covered above?"
          ),
          answerParagraph(
            `${req.body.socialHistoryValue.otherStressorsExperience}`
          ),
          req.body.socialHistoryValue?.otherStressorsExperience === "Yes"
            ? questionParagraph("Explain:")
            : undefined,
          req.body.socialHistoryValue?.otherStressorsExperience === "Yes"
            ? answerParagraph(
                `${req.body.socialHistoryValue.explainStressorsExperience}`
              )
            : undefined,

          TitleParagraph("Criminal History"),
          questionParagraph("164. Have you ever been arrested?"),
          answerParagraph(`${req.body.criminalHistoryValue.arrested}`),

          req.body.criminalHistoryValue?.arrested === "Yes"
            ? questionParagraph("What were the charges?")
            : undefined,
          req.body.criminalHistoryValue?.arrested === "Yes"
            ? answerParagraph(`${req.body.criminalHistoryValue.charges}`)
            : undefined,
          req.body.criminalHistoryValue?.arrested === "Yes"
            ? questionParagraph(
                "Were you ever incarcerated? If yes, for how long?"
              )
            : undefined,
          req.body.criminalHistoryValue?.arrested === "Yes"
            ? answerParagraph(
                `${req.body.criminalHistoryValue.everIncarcerated}`
              )
            : undefined,
          req.body.criminalHistoryValue?.arrested === "Yes"
            ? questionParagraph("Are you currently on parole or probation?")
            : undefined,
          req.body.criminalHistoryValue?.arrested === "Yes"
            ? answerParagraph(
                `${req.body.criminalHistoryValue.currentlyParole}`
              )
            : undefined,

          TitleParagraph("Violence History"),
          questionParagraph("165. Have you ever been arrested?"),
          answerParagraph(
            `${req.body.violenceHistoryValue.physicalAltercations}`
          ),
          req.body.violenceHistoryValue?.physicalAltercations === "Yes"
            ? questionParagraph(
                "How many altercations have you been involved in?"
              )
            : undefined,
          req.body.violenceHistoryValue?.physicalAltercations === "Yes"
            ? answerParagraph(
                `${req.body.violenceHistoryValue.altercationsTimes}`
              )
            : undefined,
          req.body.violenceHistoryValue?.physicalAltercations === "Yes"
            ? questionParagraph(
                "What were the circumstances surrounding these altercations?"
              )
            : undefined,
          req.body.violenceHistoryValue?.physicalAltercations === "Yes"
            ? answerParagraph(
                `${req.body.violenceHistoryValue.circumstancesSurrounding}`
              )
            : undefined,

          questionParagraph(
            "166. Do you currently or have you recently had thoughts of wanting to hurt anyone?"
          ),
          answerParagraph(
            `${req.body.violenceHistoryValue.thoughtsHurtAnyone}`
          ),
          req.body.violenceHistoryValue?.thoughtsHurtAnyone === "Yes"
            ? questionParagraph(
                "Please explain who you want to hurt and how you may go about accomplishing this"
              )
            : undefined,
          req.body.violenceHistoryValue?.thoughtsHurtAnyone === "Yes"
            ? answerParagraph(
                `${req.body.violenceHistoryValue.explainAccomplishingHurt}`
              )
            : undefined,

          questionParagraph("167. Have you ever been the victim of violence?"),
          answerParagraph(`${req.body.violenceHistoryValue.victimViolence}`),
          req.body.violenceHistoryValue?.thoughtsHurtAnyone === "Yes"
            ? questionParagraph("Are you currently in danger of violence?")
            : undefined,
          req.body.violenceHistoryValue?.thoughtsHurtAnyone === "Yes"
            ? answerParagraph(
                `${req.body.violenceHistoryValue.currentlyDangerViolence}`
              )
            : undefined,

          TitleParagraph("Military History"),
          questionParagraph("168. Have you ever enrolled in the military"),
          answerParagraph(`${req.body.militaryHistoryValue.enrolledMilitary}`),
          req.body.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? questionParagraph("Which branch of the military were you in?")
            : undefined,
          req.body.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? answerParagraph(`${req.body.militaryHistoryValue.branchMilitary}`)
            : undefined,
          req.body.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? questionParagraph("What dates were you in the military?")
            : undefined,
          req.body.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? answerParagraph(
                `from ${req.body.militaryHistoryValue.militaryDatesFrom} to ${req.body.militaryHistoryValue.militaryDatesTo} `
              )
            : undefined,
          req.body.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? questionParagraph("What was your job in the military?")
            : undefined,
          req.body.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? answerParagraph(`${req.body.militaryHistoryValue.militaryJob}`)
            : undefined,
          req.body.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? questionParagraph("What was your discharge status?")
            : undefined,
          req.body.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? answerParagraph(
                `${req.body.militaryHistoryValue.dischargeStatus}`
              )
            : undefined,

          TitleParagraph("CURRENT DAILY ACTIVITIES"),
          questionParagraph("169. Time You Awaken- On Work Days:"),
          answerParagraph(
            `${req.body.currentDailyActivitiesValue.awakenTimeWorkDays}`
          ),
          questionParagraph("170. Time You Awaken- On Not Work Days:"),
          answerParagraph(
            `${req.body.currentDailyActivitiesValue.awakenTimeNotWorkDays}`
          ),
          questionParagraph("171. Time You Go To Bed:"),
          answerParagraph(`${req.body.currentDailyActivitiesValue.goToBed}`),
          questionParagraph("172. Time Fall Asleep:"),
          answerParagraph(
            `${req.body.currentDailyActivitiesValue.fallAsleepTime}`
          ),
          questionParagraph(
            "173. Describe All of the Activities You Do From the Time You Wake Up Until You Go To Bed at Night:"
          ),
          questionParagraph("What You Do From 6 a.m. to 8 a.m.:"),
          answerParagraph(`${req.body.currentDailyActivitiesValue.do6am}`),
          questionParagraph("What You Do From 8 a.m. to 10 a.m.:"),
          answerParagraph(`${req.body.currentDailyActivitiesValue.do8am}`),
          questionParagraph("What You Do From 10 a.m. to 12 p.m.:"),
          answerParagraph(`${req.body.currentDailyActivitiesValue.do10am}`),
          questionParagraph("What You Do From 12 p.m. to 2 p.m.:"),
          answerParagraph(`${req.body.currentDailyActivitiesValue.do12pm}`),
          questionParagraph("What You Do From 2 p.m. to 4 p.m.:"),
          answerParagraph(`${req.body.currentDailyActivitiesValue.do2pm}`),
          questionParagraph("What You Do From 4 p.m. to 6 p.m.:"),
          answerParagraph(`${req.body.currentDailyActivitiesValue.do4pm}`),
          questionParagraph("What You Do From 6 p.m. to 8 p.m.:"),
          answerParagraph(`${req.body.currentDailyActivitiesValue.do6pm}`),
          questionParagraph("What You Do From 8 p.m. to 10 p.m.:"),
          answerParagraph(`${req.body.currentDailyActivitiesValue.do8pm}`),
          questionParagraph(
            "What You Do From 10 p.m. to 12 p.m. (or time to bed):"
          ),
          answerParagraph(`${req.body.currentDailyActivitiesValue.do10pm}`),
          questionParagraph("What You Do From 12 p.m. to 6 a.m.:"),
          answerParagraph(`${req.body.currentDailyActivitiesValue.do12p6am}`),

          questionParagraph(
            "174. What Are Your Leisure Activities or Hobbies?"
          ),
          answerParagraph(
            `${req.body.currentDailyActivitiesValue.leisureActivities}`
          ),
          questionParagraph("175. Do You Have Any Trouble With the Following?"),
          answerParagraph(
            objectCardType(
              req.body.currentDailyActivitiesValue.troubleFollowing
            )
          ),

          questionParagraph(
            "176. Activities of Daily Living Worksheet. Please put a mark in the box that describes your ability to carry out the following:"
          ),
          answerParagraph(
            objectCardType(
              req.body.currentDailyActivitiesValue.dailyLivingFollowing
            )
          ),
          questionParagraph(
            "177. Please rate the amount of difficulty you have with the following:"
          ),
          answerParagraph(
            objectCardType(req.body.currentDailyActivitiesValue.difficultAmount)
          ),
          questionParagraph(
            "178. Please List Any Activities Not Included Above That You Used To Do But Are Unable To Do Or Don't Do Because Of Your Condition And Explain Why"
          ),
          answerParagraph(
            `${req.body.currentDailyActivitiesValue.anyActivitiesListBefore}`
          ),

          TitleParagraph("Developmental History"),
          questionParagraph("179. Where were you born?"),
          answerParagraph(`${req.body.developmentalValue.bornPlace}`),
          questionParagraph("180. Where were you primarily raised?"),
          answerParagraph(`${req.body.developmentalValue.primarilyRaised}`),
          questionParagraph(
            "181. Who primarlily raised you during your childhood?"
          ),
          answerParagraph(`${req.body.developmentalValue.raisedChilhood}`),
          questionParagraph(
            "182. How would you rate your relationship with the primary adults who raised you when you were a child?"
          ),
          answerParagraph(
            `${req.body.developmentalValue?.relationshipPrimaryAdults}`
          ),
          questionParagraph("183. Do you have siblings?"),
          answerParagraph(`${req.body.developmentalValue.haveSiblings}`),
          req.body.developmentalValue?.haveSiblings === "Yes"
            ? questionParagraph("How many siblings do you have?")
            : undefined,
          req.body.developmentalValue?.haveSiblings === "Yes"
            ? answerParagraph(`${req.body.developmentalValue.siblingsMany}`)
            : undefined,
          req.body.developmentalValue?.haveSiblings === "Yes"
            ? questionParagraph(
                "How many of these siblings were you raised by?"
              )
            : undefined,
          req.body.developmentalValue?.haveSiblings === "Yes"
            ? answerParagraph(`${req.body.developmentalValue.siblingsRaised}`)
            : undefined,
          req.body.developmentalValue?.haveSiblings === "Yes"
            ? questionParagraph(
                "How is your relationship with your siblings (select all that apply)?"
              )
            : undefined,
          req.body.developmentalValue?.haveSiblings === "Yes"
            ? answerParagraph(
                `${req.body.developmentalValue.relationshipSiblings}`
              )
            : undefined,

          questionParagraph(
            "184. Did you experience any abuse during your childhood?"
          ),
          answerParagraph(
            `${req.body.developmentalValue.experienceAbuseChildhood}`
          ),
          questionParagraph("185. Were your parents ever married?"),
          answerParagraph(`${req.body.developmentalValue.parentsMarried}`),
          req.body.developmentalValue?.parentsMarried === "Yes"
            ? questionParagraph("Did your parents remain married?")
            : undefined,
          req.body.developmentalValue?.parentsMarried === "Yes"
            ? answerParagraph(
                `${req.body.developmentalValue.parentsRemainMarried}`
              )
            : undefined,
          req.body.developmentalValue?.parentsMarried === "Yes"
            ? questionParagraph(
                "Did your parents divorce, separate, or have another arrangment?"
              )
            : undefined,
          req.body.developmentalValue?.parentsMarried === "Yes"
            ? answerParagraph(`${req.body.developmentalValue.parentsDivorce}`)
            : undefined,
          req.body.developmentalValue?.parentsMarried === "Yes"
            ? questionParagraph(
                "How old were you when your parents divorced or separated?"
              )
            : undefined,
          req.body.developmentalValue?.parentsMarried === "Yes"
            ? answerParagraph(
                `${req.body.developmentalValue.yourOldParentsDivorced}`
              )
            : undefined,

          questionParagraph("186. Did your mother work?"),
          answerParagraph(`${req.body.developmentalValue.motherWork}`),
          req.body.developmentalValue?.motherWork === "Yes"
            ? questionParagraph("What was her job?")
            : undefined,
          req.body.developmentalValue?.motherWork === "Yes"
            ? answerParagraph(`${req.body.developmentalValue.motherJob}`)
            : undefined,
          req.body.developmentalValue?.motherWork === "Yes"
            ? questionParagraph("Does your mother still work?")
            : undefined,
          req.body.developmentalValue?.motherWork === "Yes"
            ? answerParagraph(`${req.body.developmentalValue.motherStillWork}`)
            : undefined,

          questionParagraph("187. Is your mother current living?"),
          answerParagraph(`${req.body.developmentalValue.bornPlace}`),
          req.body.developmentalValue?.motherCurrentLiving === "No"
            ? questionParagraph("How old was she when she died?")
            : undefined,
          req.body.developmentalValue?.motherCurrentLiving === "No"
            ? answerParagraph(`${req.body.developmentalValue.diedMotherOld}`)
            : undefined,
          req.body.developmentalValue?.motherCurrentLiving === "No"
            ? questionParagraph("What did she die from?")
            : undefined,
          req.body.developmentalValue?.motherCurrentLiving === "No"
            ? answerParagraph(`${req.body.developmentalValue.whatDiedMother}`)
            : undefined,

          questionParagraph("188. Did your father work?"),
          answerParagraph(`${req.body.developmentalValue.fatherWork}`),
          req.body.developmentalValue?.fatherWork === "Yes"
            ? questionParagraph("What was his job?")
            : undefined,
          req.body.developmentalValue?.fatherWork === "Yes"
            ? answerParagraph(`${req.body.developmentalValue.fatherJob}`)
            : undefined,
          req.body.developmentalValue?.motherWork === "Yes"
            ? questionParagraph("Does your father still work?")
            : undefined,
          req.body.developmentalValue?.motherWork === "Yes"
            ? answerParagraph(`${req.body.developmentalValue.fatherStillWork}`)
            : undefined,

          questionParagraph("189. Is your father current living?"),
          answerParagraph(`${req.body.developmentalValue.bornPlace}`),
          req.body.developmentalValue?.fatherCurrentLiving === "No"
            ? questionParagraph("How old was he when she died?")
            : undefined,
          req.body.developmentalValue?.fatherCurrentLiving === "No"
            ? answerParagraph(`${req.body.developmentalValue.diedFatherOld}`)
            : undefined,
          req.body.developmentalValue?.fatherCurrentLiving === "No"
            ? questionParagraph("What did he die from?")
            : undefined,
          req.body.developmentalValue?.fatherCurrentLiving === "No"
            ? answerParagraph(`${req.body.developmentalValue.whatDiedFather}`)
            : undefined,

          questionParagraph(
            "190. Which of these statements best describes your social life as a child:"
          ),
          answerParagraph(
            `${req.body.developmentalValue.bestDescribesSocialLifeChild}`
          ),

          questionParagraph(
            "191. What activities did you enjoy during your childhood?"
          ),
          answerParagraph(
            `${req.body.developmentalValue.enjoyActivitiesChild}`
          ),

          TitleParagraph("Additional Information"),
          questionParagraph(
            "192. Is there anything else you would like to share with the evaluating clinician before your visit begins?"
          ),
          answerParagraph(`${req.body.additionalValue.evaluatingClinician}`),
          questionParagraph(
            "193. Please Provide Any Additional Information I Should Know About You:"
          ),
          answerParagraph(
            `${req.body.additionalValue.yourAdditionalInformation}`
          ),
        ],
      },
    ],
  });

  const storyDoc = new Document({
    sections: [
      {
        children: [
          TitleParagraph("Initial Intake Form"),
          storyParagraph(
            `${req.body.demographicInformation.fullName} is a ${req.body.demographicInformation.maritalStatusItems}, ${req.body.demographicInformation.radioSexItem}.`
          ),
          storyParagraph(`${req.body.demographicInformation.birth}-year-old,`),
          storyParagraph(
            `${req.body.demographicInformation.checkedEthnicityItems}`
          ),
          storyParagraph(
            `born a biological ${req.body.demographicInformation.radioSexItem}`
          ),
          storyParagraph(
            `who goes by a preferred pronoun of ${req.body.demographicInformation.radioPreferPronounItem}`
          ),
          storyParagraph(
            `${req.body.demographicInformation.fullName} reported they are currently single ${req.body.demographicInformation.maritalStatusItems}`
          ),
          storyParagraph(
            `At the time of his injury, ${req.body.demographicInformation.fullName} worked for ${req.body.employmentInjuryPhysicalValue.currentEmployerName}.`
          ),
          storyParagraph(
            `${pronounPrefer} described this business as ${req.body.employmentInjuryPhysicalValue.businessNature}`
          ),
          storyParagraph(
            `${pronoun} first day of work there was ${req.body.employmentInjuryPhysicalValue?.jobBeganDate}`
          ),
          storyParagraph(
            `The most recent day ${pronounPrefer} worked at this job was ${req.body.employmentInjuryPhysicalValue?.jobLastDate}`
          ),
          storyParagraph(
            `${pronoun} job title when ${pronounPrefer} started this employment was as a ${req.body.employmentInjuryPhysicalValue?.startedJobTitle}`
          ),
          storyParagraph(
            `${pronoun} most recent job title at this employment was ${req.body.employmentInjuryPhysicalValue?.currentTitle}`
          ),
          storyParagraph(
            `${pronoun} employment duties include the following: ${req.body.employmentInjuryPhysicalValue?.employmentDuty}`
          ),
          storyParagraph(
            `${pronoun} typical work schedule was ${req.body.employmentInjuryPhysicalValue?.typicalWorkSchedule}`
          ),
          storyParagraph(
            `${pronoun} salary at this position is ${req.body.employmentInjuryPhysicalValue.salary}`
          ),
          storyParagraph(
            `${pronoun} hourly rate is ${req.body.employmentInjuryPhysicalValue.hourlyRate}`
          ),
          validateBoolean(
            req.body.employmentInjuryPhysicalValue.receiveOvertimePay
          )
            ? storyParagraph(
                `${pronounPrefer} does receive overtime pay ${req.body.employmentInjuryPhysicalValue.overtimeRate} `
              )
            : storyParagraph(
                `${pronounPrefer} does not receive overtime pay ${req.body.employmentInjuryPhysicalValue.overtimeRate} `
              ),
          storyParagraph(
            `${pronounPrefer} stated that he likes his job because of ${req.body.employmentInjuryPhysicalValue?.likeJob}`
          ),
          storyParagraph(
            `${pronounPrefer} stated that he does not like this job due to ${req.body.employmentInjuryPhysicalValue.notLikeJob}`
          ),
          validateBoolean(
            req.body.employmentInjuryPhysicalValue
              .radioPhysicalConditionBeforeInjuryItem
          )
            ? storyParagraph(
                `Prior to the injury, ${pronounPrefer} was treated for any physical or Medical Condition(s).`
              )
            : storyParagraph(
                `Prior to the injury, ${pronounPrefer} was not treated for any physical or Medical Condition(s).`
              ),
          validateBoolean(
            req.body.employmentInjuryPhysicalValue
              .radioMentalConditionBeforeInjuryItem
          )
            ? storyParagraph(
                `Before the injury, ${pronounPrefer} was being treated for any mental or Emotional Condition(s).`
              )
            : storyParagraph(
                `Before the injury, ${pronounPrefer} was not being treated for any mental or Emotional Condition(s).`
              ),

          validateBoolean(
            req.body.employmentInjuryPhysicalValue
              .radioEmotionalSymptomsBeforeInjuryItem
          )
            ? storyParagraph(
                `Before the injury, ${pronounPrefer} was experiencing any emotional symptoms.`
              )
            : storyParagraph(
                `Before the injury, ${pronounPrefer} was not experiencing any emotional symptoms.`
              ),

          storyParagraph(
            `${pronounPrefer} Described These Medical or Emotional Conditions or Symptoms BEFORE The Injury as follows:`
          ),
          validateBoolean(
            req.body.employmentInjuryPhysicalValue.describeMedicalCondition
          )
            ? storyParagraph(
                `${pronounPrefer} was taking medications before ${pronoun} injury.`
              )
            : storyParagraph(
                `${pronounPrefer} was not taking medications before ${pronoun} injury.`
              ),
          storyParagraph(
            `The medications ${pronounPrefer} was taking before the injury were the following:`
          ),
          storyParagraph(`${pronoun} Injury occurred on the following date:`),
          storyParagraph(
            `${pronounPrefer} Described ${pronoun} Injury as follows:`
          ),
          validateBoolean(
            req.body.employmentInjuryPhysicalValue
              .radioDisabilityConnectionClaimItem
          )
            ? storyParagraph(
                `${pronounPrefer} is Currently Receiving Disability In Connection With ${pronoun} Claim..`
              )
            : storyParagraph(
                `${pronounPrefer} is not Currently Receiving Disability In Connection With ${pronoun} Claim.`
              ),

          validateBoolean(
            req.body.employmentInjuryPhysicalValue
              .radioDisabilityConnectionClaimItem
          )
            ? storyParagraph(
                `${pronounPrefer} currently receives currentDisability`
              )
            : undefined,
          validateBoolean(
            req.body.employmentInjuryPhysicalValue.radioCurrentlyWorkingItem
          )
            ? storyParagraph(
                `${pronounPrefer} stated that ${pronounPrefer} would have continued working if not injured.`
              )
            : storyParagraph(
                `${pronounPrefer} stated that ${pronounPrefer} would not have continued working if not injured.`
              ),
          validateBoolean(
            req.body.employmentInjuryPhysicalValue.radioConflictsItem
          )
            ? storyParagraph(
                `${pronounPrefer} reported that ${pronounPrefer} has had conflicts with other people at his work.`
              )
            : storyParagraph(
                `${pronounPrefer} reported that ${pronounPrefer} has not had conflicts with other people at his work.`
              ),
          validateBoolean(
            req.body.employmentInjuryPhysicalValue.radioConflictsItem
          )
            ? storyParagraph(
                `In total, ${pronounPrefer} estimated that ${pronounPrefer} has ${req.body.employmentInjuryPhysicalValue.conflictsCount} separate conflicts with others at work.`
              )
            : undefined,
          validateBoolean(
            req.body.employmentInjuryPhysicalValue.radioConflictsItem
          )
            ? storyParagraph(
                `${pronounPrefer} described these conflicts as follows: ${req.body.employmentInjuryPhysicalValue.eachConflicts}`
              )
            : undefined,
          validateBoolean(
            req.body.employmentInjuryPhysicalValue.radioConflictsItem
          )
            ? storyParagraph(
                `${pronounPrefer} rated the percentage that each of these conflicts caused ${pronoun} to feel upset as follows: ${req.body.employmentInjuryPhysicalValue.conflictsRate}`
              )
            : undefined,

          storyParagraph(
            `${pronounPrefer} described ${pronoun} working relationship with management or ${pronoun} supervisors as ${req.body.employmentInjuryPhysicalValue.relationShipLikeManagement}`
          ),
          storyParagraph(
            `${pronoun} immediate supervisor was ${req.body.employmentInjuryPhysicalValue.immediateSupervisorName}`
          ),
          storyParagraph(
            `and ${pronounPrefer} described their relationship as ${req.body.employmentInjuryPhysicalValue.relationshipImmediateSupervisor}`
          ),
          req.body.employmentInjuryPhysicalValue
            .relationshipImmediateSupervisor === "Poor"
            ? storyParagraph(
                `due to ${req.body.employmentInjuryPhysicalValue.explainSuperVisorReason}`
              )
            : undefined,
          storyParagraph(
            `${pronoun} performance appraisals were ${req.body.employmentInjuryPhysicalValue.performanceAppraisals}`
          ),
          req.body.employmentInjuryPhysicalValue.performanceAppraisals ===
          "Poor"
            ? storyParagraph(
                `due to ${req.body.employmentInjuryPhysicalValue.explainPerformanceAppraisals}`
              )
            : undefined,

          validateBoolean(req.body.employmentInjuryPhysicalValue.verbalWarning)
            ? storyParagraph(
                `${pronounPrefer} has Received Verbal or Written Warnings.`
              )
            : storyParagraph(
                `${pronounPrefer} has not Received Verbal or Written Warnings.`
              ),
          validateBoolean(req.body.employmentInjuryPhysicalValue.verbalWarning)
            ? storyParagraph(
                `consisting of ${req.body.employmentInjuryPhysicalValue.verbalWarningDateReason}`
              )
            : undefined,
          storyParagraph(
            `${pronounPrefer} described ${pronoun} working relationship with ${pronoun} coworkers as ${req.body.employmentInjuryPhysicalValue.relationshipCoWorkers}`
          ),
          req.body.employmentInjuryPhysicalValue.relationshipCoWorkers ===
          "Poor"
            ? storyParagraph(
                `due to ${req.body.employmentInjuryPhysicalValue.explainRelationshipCoWorkers}`
              )
            : undefined,

          validateBoolean(req.body.employmentInjuryPhysicalValue.lastStraw)
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} stated that there was a "Last Straw" Event Near the Last Day of Work`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} stated that there was not a "Last Straw" Event Near the Last Day of Work`
              ),
          validateBoolean(req.body.employmentInjuryPhysicalValue.lastStraw)
            ? storyParagraph(
                `consisting of ${req.body.employmentInjuryPhysicalValue.explainLastStraw}`
              )
            : undefined,

          validateBoolean(
            req.body.currentEmployerValue.currentlyWorkEmployerInjury
          )
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} currently works for the same employer where the above injury occurred.`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} currently does not work for the same employer where the above injury occurred.`
              ),

          !validateBoolean(
            req.body.currentEmployerValue.currentlyWorkEmployerInjury
          )
            ? storyParagraph(
                `Currently, ${pronounPrefer} worked for ${req.body.currentEmployerValue.currentlyWorkEmployerName}`
              )
            : undefined,
          !validateBoolean(
            req.body.currentEmployerValue.currentlyWorkEmployerInjury
          )
            ? storyParagraph(
                `${pronounPrefer} described this business as ${req.body.currentEmployerValue.currentlyWorkNatureBusiness}`
              )
            : undefined,
          !validateBoolean(
            req.body.currentEmployerValue.currentlyWorkEmployerInjury
          )
            ? storyParagraph(
                `${pronoun} job title at this employment is ${req.body.currentEmployerValue.currentlyWorkJobTitle}`
              )
            : undefined,
          !validateBoolean(
            req.body.currentEmployerValue.currentlyWorkEmployerInjury
          )
            ? storyParagraph(
                `${pronoun} employment duties include the following: ${req.body.currentEmployerValue.currentlyWorkJobDuties}`
              )
            : undefined,
          !validateBoolean(
            req.body.currentEmployerValue.currentlyWorkEmployerInjury
          )
            ? storyParagraph(
                `${pronoun} first day of work there was ${req.body.currentEmployerValue.currentlyWorkJobBeganDate}.`
              )
            : undefined,
          !validateBoolean(
            req.body.currentEmployerValue.currentlyWorkEmployerInjury
          )
            ? storyParagraph(
                `${pronoun} typical work schedule is ${req.body.currentEmployerValue.currentlyWorkSchedule}`
              )
            : undefined,
          !validateBoolean(
            req.body.currentEmployerValue.currentlyWorkEmployerInjury
          )
            ? storyParagraph(
                `${pronoun} pay rate is ${req.body.currentEmployerValue.currentlyWorkSalary}`
              )
            : undefined,
          !validateBoolean(
            req.body.currentEmployerValue.currentlyWorkEmployerInjury
          ) &&
          validateBoolean(
            req.body.currentEmployerValue.currentlyWorkLikeThisJob
          )
            ? storyParagraph(`${pronounPrefer} enjoyes this job.`)
            : storyParagraph(`${pronounPrefer} does not enjoy this job.`),

          storyParagraph(
            `${req.body.demographicInformation.fullName} reported that his injury was in part or entirely physical.`
          ),
          storyParagraph(
            `${pronounPrefer} stated that the first symptoms that ${pronounPrefer} experienced was ${req.body.physicalInjuryValue.firstSymptoms}`
          ),
          storyParagraph(
            `Following this injury, the first treatment that ${pronounPrefer} received was ${req.body.physicalInjuryValue.firstTreatment}`
          ),
          storyParagraph(
            `The remainder of ${pronoun} treatment has consisted of the following: ${req.body.physicalInjuryValue.restYourTreatment}`
          ),
          storyParagraph(
            `The doctors ${pronounPrefer} has seen for this physical injury are ${req.body.physicalInjuryValue.doctorsList}`
          ),
          validateBoolean(req.body.physicalInjuryValue.receivedSurgery)
            ? storyParagraph(
                `${pronounPrefer} received surgery for this injury`
              )
            : storyParagraph(
                `${pronounPrefer} did not receive surgery for this injury`
              ),
          storyParagraph(
            `${pronoun} surgies consisted of ${req.body.physicalInjuryValue.surgeryList}`
          ),
          storyParagraph(
            `The medications ${pronounPrefer} received for this physical injury include: ${req.body.physicalInjuryValue.medicationList}`
          ),
          validateBoolean(req.body.physicalInjuryValue.treatmentsHelped)
            ? storyParagraph(
                `${pronounPrefer} reported that the above treatments have helped relieve ${pronoun} pain.`
              )
            : storyParagraph(
                `${pronounPrefer} reported that the above treatments have not helped relieve ${pronoun} pain.`
              ),
          validateBoolean(req.body.physicalInjuryValue?.stillWorking)
            ? storyParagraph(`${pronounPrefer} is still working.`)
            : storyParagraph(`${pronounPrefer} is not still working.`),
          storyParagraph(
            `${pronounPrefer} explained that ${pronounPrefer} is not working due to ${req.body.physicalInjuryValue.leavingReason}`
          ),

          storyParagraph(
            `${req.body.demographicInformation.fullName} reported that ${pronounPrefer} is most bothered on this day by the following: ${req.body.chiefComplaintValue.mostBothered}?`
          ),
          storyParagraph(
            `${req.body.demographicInformation.fullName} reported that ${pronounPrefer} has experienced a cluster of ${req.body.chiefComplaintValue?.currentlyExperiencingSymptom} symptoms`
          ),
          req.body.chiefComplaintValue?.currentlyExperiencingSymptom !== "" &&
          req.body.chiefComplaintValue?.currentlyExperiencingSymptom !==
            "None of the above"
            ? storyParagraph(`that began ${req.body.chiefComplaintValue?.currentEpisodeDate} ago.
            [${pronounPrefer} can not remember a time when ${pronounPrefer} did not feel these emotions.]`)
            : undefined,

          validateBoolean(
            req.body.chiefComplaintValue?.specificStressfulSymptom
          )
            ? storyParagraph(
                `${pronounPrefer} has experienced these psychiatric symptoms in response to a specific stressful event.`
              )
            : storyParagraph(
                `${pronounPrefer} has not experienced these psychiatric symptoms in response to a specific stressful event.`
              ),
          validateBoolean(
            req.body.chiefComplaintValue?.specificStressfulSymptom
          )
            ? storyParagraph(
                `${pronounPrefer} reported that this trigger consisted of ${req.body.chiefComplaintValue.specificStressfulEvent}`
              )
            : undefined,
          storyParagraph(
            `${pronounPrefer} reported a history of psychosocial stressors ${req.body.chiefComplaintValue.stressFollowing}`
          ),

          storyParagraph(
            `${pronounPrefer} reports that this episode of depression, anxiety, or post-trauma emotions started on ${req.body.longitudinalHistoryValue?.emotionEpisodeBegan}.`
          ),
          storyParagraph(
            `${req.body.demographicInformation.fullName} described ${pronoun} symptoms as follows: ${req.body.longitudinalHistoryValue?.emotionSymptom}`
          ),
          storyParagraph(
            `During this current or most recent symptom episode, ${pronoun} symptoms were the worst ${req.body.longitudinalHistoryValue?.mostWorstSymptom}`
          ),
          storyParagraph(
            `${pronounPrefer} rated his depressive symptoms as a ${req.body.longitudinalHistoryValue?.depressiveSymptom} out of 10, on a scale of 1 to 10, with 0-1 equaling minimal or no when they were most severe and 10 equaling the most severe symptoms imaginable when they were most severe.`
          ),
          storyParagraph(
            `Currently, ${pronounPrefer} rates his depressive, anxiety, or post trauma symptoms symptoms as a ${req.body.longitudinalHistoryValue?.compareEmotionalSymptom} out of 10.`
          ),
          validateBoolean(
            req.body.longitudinalHistoryValue?.symptomsAffectedJob
          )
            ? storyParagraph(
                `${pronounPrefer} reported that his emotional symptoms have affected ${pronoun} ability to do ${pronoun} job.`
              )
            : storyParagraph(
                `${pronounPrefer} reported that his emotional symptoms have never affected ${pronoun} ability to do ${pronoun} job.`
              ),
          validateBoolean(
            req.body.longitudinalHistoryValue?.symptomsAffectedJob
          )
            ? storyParagraph(
                `${pronounPrefer} explained this affect as: ${req.body.longitudinalHistoryValue.describeSymptomsAffectedJob}`
              )
            : undefined,

          storyParagraph(
            `${pronounPrefer} reported that ${pronoun} current depressive symptoms consist of the following:`
          ),
          req.body.PHQValue?.interestThing !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} has retained the ability to enjoy activities that were previously enjoyable`
              )
            : storyParagraph(
                `${pronounPrefer} has lost the ability to enjoy activities that were previously enjoyable`
              ),
          req.body.PHQValue?.interestThing !== "Not at all"
            ? storyParagraph(
                `such as ${req.body.PHQValue.previouslyEnjoyable}.`
              )
            : undefined,
          storyParagraph(
            `${pronounPrefer} has experienced depressed mood occuring ${req.body.PHQValue.feelingDepressed} per week`
          ),
          req.body.PHQValue?.interestThing !== "Not at all"
            ? storyParagraph(`for ${req.body.PHQValue.duringFeelingDepressed}`)
            : undefined,
          req.body.PHQValue?.interestThing !== "Not at all"
            ? storyParagraph(
                `${pronoun} depressive symptoms have ${req.body.PHQValue.depressiveSymptomsImproved} since they started.`
              )
            : undefined,
          req.body.PHQValue?.interestThing !== "Not at all"
            ? storyParagraph(
                `${pronoun} depressive symptoms occur ${req.body.PHQValue.oftenFeelDepressed}`
              )
            : undefined,
          req.body.PHQValue?.interestThing !== "Not at all"
            ? storyParagraph(
                `for a ${req.body.PHQValue.experienceDepression} of the time each day.`
              )
            : undefined,

          req.body.PHQValue?.troubleFallingAsleep !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} has trouble falling asleep, staying asleep or sleeping too much ${req.body.PHQValue.troubleFallingAsleep} per week.`
              )
            : storyParagraph(
                `${pronounPrefer} does not have trouble falling asleep, staying asleep or sleeping too much ${req.body.PHQValue.troubleFallingAsleep} per week.`
              ),
          req.body.PHQValue?.troubleFallingAsleep !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} falls asleep after ${req.body.PHQValue.fallAsleepLong} of ${pronoun} going to bed.`
              )
            : undefined,
          req.body.PHQValue?.troubleFallingAsleep !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} wakes up  ${req.body.PHQValue.wakeUpTimes} times per night`
              )
            : undefined,
          req.body.PHQValue?.troubleFallingAsleep !== "Not at all"
            ? storyParagraph(
                `When ${pronounPrefer} wakes up during the night, ${pronounPrefer} stays awake for ${req.body.PHQValue.stayAwakeLong}.`
              )
            : undefined,
          req.body.PHQValue?.troubleFallingAsleep !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} is awoken by ${req.body.PHQValue.awakeSleepReason}`
              )
            : undefined,
          req.body.PHQValue?.troubleFallingAsleep !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} sleeps ${req.body.PHQValue.totalSleepTimes} hours per 24 hours.`
              )
            : undefined,

          req.body.PHQValue?.feelingEnergy !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} feelts tired or having little energy ${req.body.PHQValue?.feelingEnergy} during the week].`
              )
            : storyParagraph(
                `${pronounPrefer} does not feel tired or having little energy ${req.body.PHQValue?.feelingEnergy} during the week].`
              ),
          req.body.PHQValue?.poorAppetite !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} has experienced poor appetite or overeating ${req.body.PHQValue.poorAppetite} during the week`
              )
            : storyParagraph(
                `${pronounPrefer} has not experienced poor appetite or overeating ${req.body.PHQValue.poorAppetite} during the week`
              ),
          req.body.PHQValue?.poorAppetite !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} has  ${req.body.PHQValue.recentlyWeightPounds} pounds`
              )
            : undefined,
          req.body.PHQValue?.poorAppetite !== "Not at all"
            ? storyParagraph(
                `in the last ${req.body.PHQValue.weightGainLostLong}`
              )
            : undefined,

          req.body.PHQValue.yourselfFeelingBad !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} reported feeling bad about themselves or that they are a failure or have let themselves or their family down ${req.body.PHQValue.yourselfFeelingBad}.`
              )
            : storyParagraph(
                `${pronounPrefer} denied feeling bad about themselves or that they are a failure or have let themselves or their family down ${req.body.PHQValue.yourselfFeelingBad}.`
              ),
          req.body.PHQValue.troubleConCentratingThing !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} reported trouble concentrating ${req.body.PHQValue.troubleConCentratingThing}.`
              )
            : storyParagraph(
                `${pronounPrefer} denied trouble concentrating ${req.body.PHQValue.troubleConCentratingThing}.`
              ),
          req.body.PHQValue.fidgetyMoving !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} reported moving or speaking so slowly that other people could have noticed,or being so fidgety or restless that ${pronounPrefer} has to move a lot more than usual ${req.body.PHQValue.fidgetyMoving}.`
              )
            : storyParagraph(
                `${pronounPrefer} denied moving or speaking so slowly that other people could have noticed,or being so fidgety or restless that ${pronounPrefer} has to move a lot more than usual ${req.body.PHQValue.fidgetyMoving}.`
              ),
          req.body.PHQValue.betterOffDeadYourself !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} reported thinking ${pronounPrefer} would be better off dead or had thoughts of hurting themselves ${req.body.PHQValue.betterOffDeadYourself}.`
              )
            : storyParagraph(
                `${pronounPrefer} denied thinking ${pronounPrefer} would be better off dead or had thoughts of hurting themselves ${req.body.PHQValue.betterOffDeadYourself}.`
              ),
          storyParagraph(
            `${pronoun} PHQ-9 score was in the ${ScoreCalculate(
              req.body.PHQValue.phqScore
            )} range.`
          ),
          req.body.PHQValue?.deadWishWakeUp !== "Not at all"
            ? storyParagraph(
                `In the past month, ${pronounPrefer} has wished ${pronounPrefer} was dead or wished ${pronounPrefer} could go to sleep and not wake up ${req.body.PHQValue.deadWishWakeUp}.`
              )
            : storyParagraph(
                `In the past month, ${pronounPrefer} has not wished ${pronounPrefer} was dead or wished ${pronounPrefer} could go to sleep and not wake up ${req.body.PHQValue.deadWishWakeUp}.`
              ),
          req.body.PHQValue.killingYourself === "Yes"
            ? storyParagraph(
                `In the past month, ${pronounPrefer} has had any actual thoughts of killing ${manPronoun}.`
              )
            : req.body.PHQValue.killingYourself === "No"
            ? storyParagraph(
                `In the past month, ${pronounPrefer} has not had any actual thoughts of killing ${manPronoun}.`
              )
            : storyParagraph(
                `In the past month, ${pronounPrefer} is not sure if ${pronounPrefer} had any actual thoughts of killing ${manPronoun}.`
              ),

          req.body.PHQValue.killingYourself !== "No" &&
          req.body.PHQValue?.killMethod === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has has been thinking about how ${pronounPrefer} might kill ${manPronoun}.`
              )
            : req.body.PHQValue.killingYourself !== "No" &&
              req.body.PHQValue?.killMethod === "No"
            ? storyParagraph(
                `${pronounPrefer} has not has been thinking about how ${pronounPrefer} might kill ${manPronoun}.`
              )
            : storyParagraph(
                `${pronounPrefer} is not sure if ${pronounPrefer} has been thinking about how ${pronounPrefer} might kill ${manPronoun}.`
              ),

          req.body.PHQValue.killingYourself !== "No" &&
          req.body.PHQValue?.killMethod !== "No" &&
          req.body.PHQValue?.actingIntention === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has had these thoughts, and had some intention of acting on them.`
              )
            : req.body.PHQValue.killingYourself !== "No" &&
              req.body.PHQValue?.killMethod !== "No" &&
              req.body.PHQValue?.actingIntention === "No"
            ? storyParagraph(
                `${pronounPrefer} has not had these thoughts, and had some intention of acting on them.`
              )
            : storyParagraph(
                `${pronounPrefer} is not sure if ${pronounPrefer} had these thoughts, and had some intention of acting on them.`
              ),

          req.body.PHQValue.killingYourself !== "No" &&
          req.body.PHQValue?.killMethod !== "No" &&
          req.body.PHQValue?.actingIntention !== "No" &&
          req.body.PHQValue?.killIntentionCarryout === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has started to work out or worked out the details of how to kill themselves.`
              )
            : req.body.PHQValue.killingYourself !== "No" &&
              req.body.PHQValue?.killMethod !== "No" &&
              req.body.PHQValue?.actingIntention !== "No" &&
              req.body.PHQValue?.killIntentionCarryout === "No"
            ? storyParagraph(
                `${pronounPrefer} has not started to work out or worked out the details of how to kill themselves.`
              )
            : storyParagraph(
                `${pronounPrefer} is not sure if ${pronounPrefer} started to work out or worked out the details of how to kill themselves.`
              ),

          req.body.PHQValue?.preparedAnythingEndYourlife === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has ever done anything, started to do anything, or prepared to do anything to end their life.`
              )
            : req.body.PHQValue?.preparedAnythingEndYourlife === "No"
            ? storyParagraph(
                `${pronounPrefer} has not ever done anything, started to do anything, or prepared to do anything to end their life.`
              )
            : storyParagraph(
                `${pronounPrefer} is not sure if ${pronounPrefer} has ever done anything, started to do anything, or prepared to do anything to end their life.`
              ),

          req.body.PHQValue.hurtingAnyone === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has had thoughts of hurting anyone else.`
              )
            : storyParagraph(
                `${pronounPrefer} has not had thoughts of hurting anyone else.`
              ),
          storyParagraph(
            `${pronounPrefer} rated his current depressive symptoms as a ${req.body.PHQValue.currentDepressiveSymptoms} out of 10, on a scale of 1 to 10, with 0-1 equaling minimal or not depression and 10 equaling the most severe depressive symptoms imaginable.`
          ),

          storyParagraph(`Over the last two weeks,`),
          storyParagraph(
            `${req.body.demographicInformation.fullName} reported experiencing anxiety symptoms ${req.body.GADValue?.feelingNervous}`
          ),
          req.body.GADValue?.feelingNervous !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} has felt anxious during this most recent episode for ${req.body.GADValue?.feltAnxiousLong}`
              )
            : undefined,
          req.body.GADValue?.feelingNervous !== "Not at all"
            ? storyParagraph(
                `that occurs ${req.body.GADValue?.feelAnxiousOften}.`
              )
            : undefined,

          req.body.GADValue?.stopControlWorring !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} reported being able to stop or control worrying ${req.body.GADValue?.stopControlWorring}.`
              )
            : storyParagraph(
                `${pronounPrefer} denies being able to stop or control worrying ${req.body.GADValue?.stopControlWorring}.`
              ),
          req.body.GADValue?.worringDifferentThing !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} reported worrying too much about different things ${req.body.GADValue?.worringDifferentThing}.`
              )
            : storyParagraph(
                `${pronounPrefer} denies worrying too much about different things ${req.body.GADValue?.worringDifferentThing}.`
              ),
          req.body.GADValue?.worringDifferentThing !== "Not at all"
            ? storyParagraph(
                `regarding ${pronoun} ${req.body.GADValue?.worringThing}`
              )
            : undefined,

          req.body.GADValue?.troubleRelaxing !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} reported trouble relaxing ${req.body.GADValue?.troubleRelaxing}.`
              )
            : storyParagraph(
                `${pronounPrefer} denies trouble relaxing ${req.body.GADValue?.troubleRelaxing}.`
              ),
          req.body.GADValue?.restlessSitHard !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} reported being so restless that it's hard to sit still ${req.body.GADValue?.restlessSitHard}.`
              )
            : storyParagraph(
                `${pronounPrefer} denies being so restless that it's hard to sit still ${req.body.GADValue?.restlessSitHard}.`
              ),
          req.body.GADValue?.easilyAnnoyed !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} reported feeling afraid as if something awful might happen ${req.body.GADValue?.easilyAnnoyed}.`
              )
            : storyParagraph(
                `${pronounPrefer} denies feeling afraid as if something awful might happen ${req.body.GADValue?.easilyAnnoyed}.`
              ),

          storyParagraph(
            `${pronoun} GAD-7 score was in the ${ScoreCalculate(
              req.body.GADValue.gadScore
            )} range.`
          ),
          storyParagraph(
            `${pronounPrefer} rated his current anxiety symptoms as a ${req.body.GADValue?.currentAnxietySymptoms} out of 10, on a scale of 1 to 10, with 0-1 equaling minimal or no anxiety and 10 equaling the most severe anxiety symptoms imaginable.`
          ),
          req.body.GADValue?.panicAttacks === "Yes"
            ? storyParagraph(
                `${pronounPrefer} also has experienced panic attacks consisting of`
              )
            : storyParagraph(
                `${pronounPrefer} also has not experienced panic attacks consisting of`
              ),
          req.body.GADValue?.panicAttacks === "Yes"
            ? storyParagraph(`${req.body.GADValue?.panicPhysicalSymptoms}`)
            : undefined,
          req.body.GADValue?.panicAttacks === "Yes"
            ? storyParagraph(
                `lasting ${req.body.GADValue?.panicAttacksLastLong}.`
              )
            : undefined,
          req.body.GADValue?.panicAttacks === "Yes" &&
          req.body.GADValue?.panicAttacksSpontaneous === "Yes"
            ? storyParagraph(
                `${pronoun} panic attacks are spontaneous and unrelated to any events.`
              )
            : storyParagraph(
                `${pronoun} panic attacks are not spontaneous and unrelated to any events.`
              ),

          req.body.GADValue?.pastTraumaticEvents === "Yes"
            ? storyParagraph(
                `The traumatic event ${pronounPrefer} experienced was ${req.body.GADValue?.traumaticEventExperience}`
              )
            : undefined,
          req.body.GADValue?.pastTraumaticEvents === "Yes"
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} experienced past traumatic event(s) consisting of ${req.body.GADValue.describeTraumaticExperience}.`
              )
            : undefined,

          storyParagraph(
            `${pronounPrefer} has experienced the following post-traumau related symptoms`
          ),
          req.body.PCLValue?.stressfulExperienceMemories !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} reports repeated, disturbing, and unwanted memories of the stressful experience  ${req.body.PCLValue?.stressfulExperienceMemories}.`
              )
            : storyParagraph(
                `${pronounPrefer} denies repeated, disturbing, and unwanted memories of the stressful experience.`
              ),
          req.body.PCLValue?.stressfulExperience !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} endorsed experiencing repeated, disturbing dreams of the stressful experience ${req.body.PCLValue?.stressfulExperience} `
              )
            : storyParagraph(
                `${pronounPrefer} denied experiencing repeated, disturbing dreams of the stressful experience.`
              ),
          req.body.PCLValue?.stressfulExperience !== "Not at all"
            ? storyParagraph(`${req.body.PCLValue?.disturbingDreamsOccur}`)
            : undefined,

          req.body.PCLValue?.suddenlyStressfulExperience !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} endorsed suddenly feeling or acting as if the stressful experience were actually happening again (as if you were actually back there reliving it) ${req.body.PCLValue?.suddenlyStressfulExperience}. `
              )
            : storyParagraph(
                `${pronounPrefer} denied suddenly feeling or acting as if the stressful experience were actually happening again (as if you were actually back there reliving it)`
              ),
          req.body.PCLValue?.veryUpsetStressfulExperience !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} endorsed experiencing repeated, disturbing dreams of the stressful experience ${req.body.PCLValue?.veryUpsetStressfulExperience} `
              )
            : storyParagraph(
                `${pronounPrefer} denied experiencing repeated, disturbing dreams of the stressful experience.`
              ),
          req.body.PCLValue?.strongPhysicalReactionStressfulExperience !==
          "Not at all"
            ? storyParagraph(
                `${pronounPrefer} endorsed having strong physical reactions when something reminded #him of the stressful experience (for example, heart pounding, trouble breathing, sweating) ${req.body.PCLValue?.stressfulExperience} `
              )
            : storyParagraph(
                `${pronounPrefer} denied having strong physical reactions when something reminded #him of the stressful experience (for example, heart pounding, trouble breathing, sweating).`
              ),
          req.body.PCLValue?.avoidingMemories !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed avoiding memories, thoughts, or feelings related to the stressful experience as ${req.body.PCLValue?.avoidingMemories} `
              )
            : storyParagraph(
                `${pronounPrefer} denied avoiding memories, thoughts, or feelings related to the stressful experience as.`
              ),
          req.body.PCLValue?.avoidingExternalReminders !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} endorsed avoiding external reminders of the stressful experience (for example, people, places, conversations, activities, objects, or situations) ${req.body.PCLValue?.avoidingExternalReminders}`
              )
            : storyParagraph(
                `${pronounPrefer} denied avoiding external reminders of the stressful experience (for example, people, places, conversations, activities, objects, or situations).`
              ),
          req.body.PCLValue?.avoidingExternalReminders !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer} reported avoiding the following: ${req.body.PCLValue.describeSituations}`
              )
            : undefined,
          req.body.PCLValue?.avoidingExternalReminders !== "Not at all"
            ? storyParagraph(
                `The activities ${pronounPrefer} avoids in relation to the trauma includes ${req.body.PCLValue.avoidActivities}`
              )
            : undefined,

          req.body.PCLValue?.troubleStressfulExperience !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed describes trouble remembering important parts of the stressful experience ${req.body.PCLValue?.troubleStressfulExperience} `
              )
            : storyParagraph(
                `${pronounPrefer} denied describes trouble remembering important parts of the stressful experience.`
              ),
          req.body.PCLValue?.strongNegativeBeliefs !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed describes having strong negative beliefs about yourself, other people, or the world (for example, having thoughts such as: I am bad, there is something seriously wrong with me, ${req.body.PCLValue?.strongNegativeBeliefs} `
              )
            : storyParagraph(
                `${pronounPrefer} denied describes having strong negative beliefs about yourself, other people, or the world (for example, having thoughts such as: I am bad, there is something seriously wrong with me).`
              ),
          req.body.PCLValue?.stressfulExperienceBlaming !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed describes blaming ${manPronoun} or someone else for the stressful experience or what happened after it ${req.body.PCLValue?.stressfulExperienceBlaming} `
              )
            : storyParagraph(
                `${pronounPrefer} denied describes blaming ${manPronoun} or someone else for the stressful experience or what happened after it`
              ),
          req.body.PCLValue?.strongNegativefeelings !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed having strong negative feelings such as fear, horror, anger, guilt, or shame as ${req.body.PCLValue?.strongNegativefeelings} `
              )
            : storyParagraph(
                `${pronounPrefer} denied having strong negative feelings such as fear, horror, anger, guilt, or shame as.`
              ),
          req.body.PCLValue?.lossInterestActivity !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed loss of interest in activities that you used to enjoy ${req.body.PCLValue?.lossInterestActivity} `
              )
            : storyParagraph(
                `${pronounPrefer} denied loss of interest in activities that you used to enjoy.`
              ),
          req.body.PCLValue?.feelingDistantPeople !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed experiencing feeling distant or cut off from other people ${req.body.PCLValue?.feelingDistantPeople} `
              )
            : storyParagraph(
                `${pronounPrefer} denied experiencing feeling distant or cut off from other people.`
              ),
          req.body.PCLValue?.troubleExperiencePositiveFeeling !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed trouble experiencing positive feelings (for example, being unable to feel happiness or have loving feelings for people close to ${manPronoun}) ${req.body.PCLValue?.troubleExperiencePositiveFeeling} `
              )
            : storyParagraph(
                `${pronounPrefer} denied trouble experiencing positive feelings (for example, being unable to feel happiness or have loving feelings for people close to ${manPronoun}).`
              ),
          req.body.PCLValue?.irritableBehavior !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed irritable behavior, angry outbursts, or acting aggressively ${req.body.PCLValue?.irritableBehavior} `
              )
            : storyParagraph(
                `${pronounPrefer} denied irritable behavior, angry outbursts, or acting aggressively.`
              ),
          req.body.PCLValue?.manyRisksThing !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed taking too many risks or doing things that could cause you harm ${req.body.PCLValue?.manyRisksThing} `
              )
            : storyParagraph(
                `${pronounPrefer} denied taking too many risks or doing things that could cause you harm.`
              ),
          req.body.PCLValue?.beingWatchful !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed being “superalert” or watchful or on guard ${req.body.PCLValue?.beingWatchful} `
              )
            : storyParagraph(
                `${pronounPrefer} denied being “superalert” or watchful or on guard.`
              ),
          req.body.PCLValue?.easilyStartled !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed feeling jumpy or easily startled ${req.body.PCLValue?.easilyStartled} `
              )
            : storyParagraph(
                `${pronounPrefer} denied feeling jumpy or easily startled.`
              ),
          req.body.PCLValue?.difficultyConcentrating !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed having difficulty concentrating ${req.body.PCLValue?.difficultyConcentrating} `
              )
            : storyParagraph(
                `${pronounPrefer} denied having difficulty concentrating.`
              ),
          req.body.PCLValue?.troubleFallingAsleep !== "Not at all"
            ? storyParagraph(
                `${pronounPrefer}  endorsed trouble falling or staying asleep ${req.body.PCLValue?.troubleFallingAsleep} `
              )
            : storyParagraph(
                `${pronounPrefer} denied trouble falling or staying asleep.`
              ),

          req.body.PCLValue.PCLScore >= 31 && req.body.PCLValue.PCLScore <= 33
            ? storyParagraph(
                `${pronoun} PCL-5 score is indicative of probable PTSD.`
              )
            : storyParagraph(
                `${pronoun} PCL-5 score is not indicative of probable PTSD.`
              ),
          storyParagraph(
            `${pronounPrefer} rated ${pronoun} current post trauma symptoms as a ${req.body.PCLValue?.currentRelatedSymptoms} out of 10, on a scale of 1 to 10, with 0-1 equaling minimal or no post trauma symptoms and 10 equaling the most severe post traumic symptoms imaginable.`
          ),

          storyParagraph(
            `${pronounPrefer} currently takes the following psychiatric medications: ${req.body.currentTreatmentValue?.currentlyPsychiatricMedications}.`
          ),
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? storyParagraph(
                `${pronounPrefer} has taken these medications since ${req.body.currentTreatmentValue.medicationLong}.`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? storyParagraph(
                `${pronounPrefer} stated he takes these medications ${req.body.currentTreatmentValue.medicationReason}.`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? storyParagraph(
                `${pronounPrefer} stated that these medications have produced ${cardFieldType(
                  req.body.currentTreatmentValue.medicationsEffectYourCondition
                )}.`
              )
            : undefined,

          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
            "Yes" &&
          req.body.currentTreatmentValue?.medicationAsPrescribed === "Yes"
            ? storyParagraph(
                `${pronounPrefer} is currently compliant with taking ${pronoun} psychiatric medications.`
              )
            : storyParagraph(
                `${pronounPrefer} is currently non compliant with taking ${pronoun} psychiatric medications.`
              ),

          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
            "Yes" &&
          req.body.currentTreatmentValue?.experiencedSideEffects !== "Other"
            ? storyParagraph(
                `${pronounPrefer} has experienced side effects consisting of ${req.body.currentTreatmentValue.experiencedSideEffects}]`
              )
            : storyParagraph(
                `${pronounPrefer} has not experienced side effects.`
              ),

          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
            "Yes" &&
          req.body.currentTreatmentValue?.experiencedSideEffects === "Other"
            ? storyParagraph(
                `and ${req.body.currentTreatmentValue.describeSideEffect}`
              )
            : undefined,

          req.body.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? storyParagraph(
                `${pronoun} most recent psychiatric medication treatment provider was ${req.body.currentTreatmentValue.recentTreatmentProvider}`
              )
            : undefined,

          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} reported that ${pronounPrefer} attends psychotherapy treatment.`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} denied that ${pronounPrefer} attends psychotherapy treatment.`
              ),
          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? storyParagraph(
                `${pronoun} most recent psychotherapy began on ${req.body.currentTreatmentValue.recentPsychotherapyBegin}`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? storyParagraph(
                `and the most recent psychotherapy session occured on ${req.body.currentTreatmentValue.recentPsychotherapySession}`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? storyParagraph(
                `${pronounPrefer} attends therapy ${req.body.currentTreatmentValue?.psychotherapySessionsDate}.`
              )
            : undefined,
          req.body.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? storyParagraph(
                `The name of ${pronoun} current or most recent psychotherapist is ${req.body.currentTreatmentValue.psychotherapistTreatmentProvider}`
              )
            : undefined,

          req.body.pastHistoryValue?.describeSymptoms !== ""
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} reported any history of prior ${req.body.pastHistoryValue?.previouslyExperiencedSymptom}`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} denied any history of prior ${req.body.pastHistoryValue?.previouslyExperiencedSymptom}`
              ),

          req.body.pastHistoryValue?.describeSymptoms !== ""
            ? storyParagraph(
                `${pronounPrefer} described ${pronoun} symptoms at that time as ${req.body.pastHistoryValue?.describeSymptoms}.`
              )
            : undefined,

          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? storyParagraph(
                `${pronounPrefer} reported that ${pronounPrefer} has had so much energy [${pronounPrefer} does not need to sleep for]`
              )
            : storyParagraph(
                `${pronounPrefer} denied that ${pronounPrefer} has ever had so much energy [${pronounPrefer} does not need to sleep] for several days or a week at a time.`
              ),
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? storyParagraph(
                `${req.body.pastHistoryValue?.sleptFewer4Hours} nights and ${pronoun}`
              )
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? storyParagraph(
                `energy is ${req.body.pastHistoryValue?.lackSleepEnergy} during that time.`
              )
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes" &&
          req.body.pastHistoryValue?.sleepFewer === "Yes"
            ? storyParagraph(
                `During this time ${pronounPrefer} slept fewer than 4 hours per night for 4-7 or more consecutive nights, he felt excessively tired`
              )
            : storyParagraph(
                `During this time ${pronounPrefer} slept fewer than 4 hours per night for 4-7 or more consecutive nights, he did not feel excessively tired`
              ),
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? storyParagraph(
                `When ${pronounPrefer} experiences these episodes of decreased need for sleep, ${pronoun} mood is ${req.body.pastHistoryValue?.mood}`
              )
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes" &&
          req.body.pastHistoryValue?.mood === "Other"
            ? storyParagraph(`${req.body.pastHistoryValue?.describeMood}`)
            : undefined,
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes" &&
          req.body.pastHistoryValue?.highEnergyTime
            ? storyParagraph(
                `During this decreased sleep episode, [he remained clean and sober throughout that time$was using substances] during that time.`
              )
            : undefined,

          storyParagraph(
            `${req.body.demographicInformation.fullName} has ${req.body.pastHistoryValue?.experienceFollowing}`
          ),
          req.body.pastHistoryValue.experienceFollowing !== ""
            ? storyParagraph(
                `The thoughts, behaviors, or rituals ${pronounPrefer} reports experiencing are ${req.body.pastHistoryValue?.recurrentRituals}`
              )
            : undefined,

          req.body.pastHistoryValue?.harmKillYourSelf === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has been recently thinking about how ${pronounPrefer} might harm or kill ${manPronoun}.`
              )
            : storyParagraph(
                `${pronounPrefer} has not been recently thinking about how ${pronounPrefer} might harm or kill ${manPronoun}.`
              ),
          req.body.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? storyParagraph(
                `${pronounPrefer} reports ever experiencing so much energy that ${pronounPrefer} do not need to sleep for several days or a week at a time.`
              )
            : storyParagraph(
                `${pronounPrefer} denies ever experiencing so much energy that ${pronounPrefer} do not need to sleep for several days or a week at a time.`
              ),
          req.body.pastHistoryValue?.highEnergyTime === "Yes"
            ? storyParagraph(
                `During this high energy time ${pronounPrefer} did engage in any high-risk behaviors.`
              )
            : storyParagraph(
                `During this high energy time ${pronounPrefer} did not engage in any high-risk behaviors.`
              ),

          req.body.pastHistoryValue?.experienceFollowing.length > 0 &&
          req.body.pastHistoryValue.pastHistoryValue
            ?.symptomsDrinkingAlcohol === "Yes"
            ? storyParagraph(
                `${pronounPrefer} was clean and sober throughout that time.`
              )
            : storyParagraph(
                `${pronounPrefer} was not clean and sober throughout that time.`
              ),

          req.body.pastHistoryValue.emotionalSymptomsRelationShip === "Yes"
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} reported that ${pronoun} emotional symptoms have had a negative effect upon ${pronoun} work, school, or relationships.`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} denied that ${pronoun} emotional symptoms have had a negative effect upon ${pronoun} work, school, or relationships.`
              ),

          storyParagraph(
            `${pronounPrefer} experienced first symptoms of depression occurred ${req.body.pastHistoryValue?.firstFeelDepressed}`
          ),
          storyParagraph(
            `${pronounPrefer} reported first experiencing high levels of anxiety ${req.body.pastHistoryValue?.feelHighLevelAnxiety}`
          ),
          storyParagraph(
            `${pronounPrefer} has been diagnosed by a healthcare provider with the following mental health conditions: ${req.body.pastHistoryValue?.diagnosedMentalHealth}`
          ),
          storyParagraph(
            `${pronounPrefer} received past medication treatment consisting of the following ${req.body.pastHistoryValue?.otherMedications}.`
          ),
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? storyParagraph(
                `${pronounPrefer} reported a previous psychiatric medication regimen consisting of: ${req.body.pastHistoryValue?.pastMedicationName}`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? storyParagraph(
                `${pronounPrefer} reported starting these psychiatric medications in the following timeframe: ${req.body.pastHistoryValue?.startedMedicationDate}`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? storyParagraph(
                `${pronoun} past psychiatric medications were stopped on: ${req.body.pastHistoryValue?.stopedMedicationDate}`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? storyParagraph(
                `${pronoun} stated that the past psychiatric medication produced ${cardFieldType(
                  req.body.pastHistoryValue?.pastPsychiatricMedication
                )}`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? storyParagraph(
                `${pronoun} past psychiatric medications were stopped on due to ${req.body.pastHistoryValue?.stopedPsychiatricMedicationsReason}.`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? storyParagraph(
                `This medication was prescribed by a ${req.body.pastHistoryValue?.prescribeThisMedication}.`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? storyParagraph(
                `${pronoun} prescribing clinician was ${req.body.pastHistoryValue?.prescribeThisMedicationNameDate}`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? storyParagraph(
                `This prescribing clinician worked at ${req.body.pastHistoryValue?.whatClinicWorked}`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? storyParagraph(
                `${pronounPrefer} also received past psychiatric treatment from ${req.body.pastHistoryValue?.otherPsychiatrists} `
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? storyParagraph(
                `This psychiatric treatment lasted ${req.body.pastHistoryValue?.thisPsychiatristSeeDate}`
              )
            : undefined,
          req.body.pastHistoryValue?.otherMedications === "Yes"
            ? storyParagraph(
                `${pronounPrefer} attended these psychiatric appointments every ${req.body.pastHistoryValue?.attendedSessionsPsychiatrist}.`
              )
            : undefined,

          req.body.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has previously received psychotherapy.`
              )
            : storyParagraph(
                `${pronounPrefer} has not previously received psychotherapy.`
              ),
          req.body.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? storyParagraph(
                `When ${req.body.demographicInformation.fullName} was asked when ${pronounPrefer} began psychotherapy treatment, ${pronounPrefer} responded, ${req.bodypastHistoryValue?.receivedPsychotherapyBegin}.`
              )
            : undefined,
          req.body.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? storyParagraph(
                `${pronounPrefer} reported attending psychotherapy for ${req.body.pastHistoryValue?.receivedPsychotherapyLong}`
              )
            : undefined,
          req.body.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? storyParagraph(
                `${pronounPrefer} attended therapy ${req.body.pastHistoryValue?.attendedSessionsPsychotherapy}`
              )
            : undefined,
          req.body.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? storyParagraph(
                `${pronounPrefer} received psychotherapy treatment with ${req.body.pastHistoryValue?.pastPsychotherapistsDate}`
              )
            : undefined,
          req.body.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? storyParagraph(
                `Additional therapy consisted of: ${req.body.pastHistoryValue?.otherPsychotherapyTreatmentList}`
              )
            : undefined,
          req.body.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? storyParagraph(`${req.body.demographicInformation.fullName} has been admitted to a psychiatric hospital.
            ${pronounPrefer} was admitted to these hospitals for`)
            : storyParagraph(
                `${req.body.demographicInformation.fullName} has never been admitted to a psychiatric hospital.`
              ),
          req.body.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? storyParagraph(
                `${pronounPrefer} was admitted to these hospitals for ${req.body.pastHistoryValue?.psychiatricHospitalizationReason}`
              )
            : undefined,
          req.body.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? storyParagraph(
                `The treatment ${pronounPrefer} received during these hospitalizations consisted of ${req.body.pastHistoryValue?.receivedTreatment}`
              )
            : undefined,
          req.body.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? storyParagraph(
                `has been admitted to the following psychiatric hospitals? ${req.body.pastHistoryValue?.admittedHospitalName}`
              )
            : storyParagraph(
                `has never been admitted to a psychiatric hospital`
              ),
          req.body.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? storyParagraph(
                `These hospitalizations ${req.body.pastHistoryValue?.hospitalizedLong}.`
              )
            : undefined,
          req.body.pastHistoryValue?.suicidalIdeation === "Yes"
            ? storyParagraph(
                `${pronounPrefer} had experienced suicidal ideation`
              )
            : storyParagraph(
                `${pronounPrefer} had never experienced suicidal ideation`
              ),

          req.body.pastHistoryValue?.suicideAttempt === "Yes"
            ? storyParagraph(`${pronounPrefer} had made a suicide attempt`)
            : storyParagraph(
                `${pronounPrefer} had never made a suicide attempt`
              ),

          req.body.pastHistoryValue?.suicideAttempt === "Yes"
            ? storyParagraph(
                `has attempted suicide ${req.body.pastHistoryValue?.attemptedSuicideTimes} times.`
              )
            : undefined,
          req.body.pastHistoryValue?.suicideAttempt === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has attempted suicide by ${req.body.pastHistoryValue?.suicideAllMethods}.`
              )
            : undefined,
          req.body.pastHistoryValue?.suicideAttempt === "Yes"
            ? storyParagraph(
                `${pronoun} most recent attempt was ${req.body.pastHistoryValue?.attemptedSuicideDate}.`
              )
            : undefined,

          req.body.pastHistoryValue?.otherPsychiatricSymptoms === "Yes"
            ? storyParagraph(
                `${pronounPrefer} ever experienced any other psychiatric symptoms besides that described above.`
              )
            : storyParagraph(
                `${pronounPrefer} denied ever experienced any other psychiatric symptoms besides that described above.`
              ),
          req.body.pastHistoryValue?.otherPsychiatricSymptoms === "Yes"
            ? storyParagraph(
                `${pronounPrefer} reported experienciong additional psychiatric symptoms consisting of ${req.body.pastHistoryValue?.describeOtherPsychiatricSymptoms}`
              )
            : undefined,

          req.body.pastHistoryValue?.otherPsychotherapyTreatment === "Yes"
            ? storyParagraph(
                `${pronounPrefer} receiving any other psychotherapy or psychiatric medication treatment .`
              )
            : storyParagraph(
                `${pronounPrefer} denied receiving any other psychotherapy or psychiatric medication treatment .`
              ),

          req.body.pastHistoryValue?.otherPsychotherapyTreatment === "Yes"
            ? storyParagraph(
                `${pronounPrefer} reported receiving additional psychotherapy or psychiatric medication treatment consisting of ${req.body.pastHistoryValue?.describeOtherPsychotherapyTreatment}`
              )
            : undefined,
          req.body.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? storyParagraph(
                `${pronounPrefer}  ever being evaluated by psychiatrists or psychologists for any other purpose outside of what is described above.`
              )
            : storyParagraph(
                `${pronounPrefer} denied ever being evaluated by psychiatrists or psychologists for any other purpose outside of what is described above.`
              ),
          req.body.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? storyParagraph(
                `${pronounPrefer} reported being evaluated by psychiatrists or psychologists for ${req.body.pastHistoryValue?.evaluationReason}`
              )
            : undefined,
          req.body.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? storyParagraph(
                `This evaluation was performed by ${req.body.pastHistoryValue?.evaluationPerformed}`
              )
            : undefined,
          req.body.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? storyParagraph(
                `and occurred ${req.body.pastHistoryValue?.evaluationOccur}`
              )
            : undefined,

          req.body.pastHistoryValue?.physicalAltercations === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has been involved in physical altercations or violence.`
              )
            : storyParagraph(
                `${pronounPrefer} has not been involved in physical altercations or violence.`
              ),
          req.body.pastHistoryValue?.physicalAltercations === "Yes"
            ? storyParagraph(
                `${req.body.pastHistoryValue?.physicialAltercationsMany} times`
              )
            : undefined,

          req.body.substanceUseValue?.followingSubstances.length > 0
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} endorsed using ${req.body.substanceUseValue?.followingSubstances}.`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} denied ever uding`
              ),

          req.body.substanceUseValue?.followingSubstances.length > 0
            ? storyParagraph(
                `${pronounPrefer} currently uses ${cardFieldType(
                  req.body.substanceUseValue?.currentlySubstance
                )}.`
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? storyParagraph(
                `in the amount of ${cardFieldType(
                  req.body.substanceUseValue?.eachSubstanceList
                )}`
              )
            : undefined,

          req.body.substanceUseValue?.followingSubstances.length > 0
            ? req.body.substanceUseValue?.eachSubstanceListStartedOld.map(
                (item) =>
                  storyParagraph(
                    `${pronounPrefer} was ${item.effect} when ${pronounPrefer} started using ${item.condition}.`
                  )
              )
            : undefined,

          req.body.substanceUseValue?.followingSubstances.length > 0
            ? storyParagraph(
                `${pronounPrefer} last used ${cardFieldType(
                  req.body.substanceUseValue?.eachSubstanceLast
                )}.`
              )
            : undefined,

          req.body.substanceUseValue?.followingSubstances.length > 0
            ? storyParagraph(
                `${pronounPrefer} reported experiencing a history of tolerance to ${cardFieldType(
                  req.body.substanceUseValue?.toleranceFollowingSubstances
                )}.`
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? storyParagraph(
                `${pronounPrefer} experiencing a history of withdrawal to ${cardFieldType(
                  req.body.substanceUseValue?.withdrawalFollowingSubstances
                )}.`
              )
            : undefined,
          req.body.substanceUseValue?.followingSubstances.length > 0
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} endorsed the following substance recovery symptoms ${req.body.substanceUseValue?.regardingAlcoholAnyFollowing}.`
              )
            : undefined,

          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has sought substance recovery treatment`
              )
            : storyParagraph(
                `${pronounPrefer} has never sought substance recovery treatment.`
              ),
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} completed ${pronoun} treatment program.`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} did not complete$ ${pronoun} treatment program.`
              ),
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? storyParagraph(
                `from ${req.body.substanceUseValue?.treatmentLastedDateFrom} to ${req.body.substanceUseValue?.treatmentLastedDateTo}.`
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? storyParagraph(
                `Following ${pronoun} treatment program, ${req.body.demographicInformation.fullName} remained clean and sober for ${req.body.substanceUseValue?.remainedTreatmentClean}. from ${req.body.substanceUseValue?.cleanSoberLastedFrom} to ${req.body.substanceUseValue.cleanSoberLastedTo}`
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? storyParagraph(
                `The longest that ${pronounPrefer} has remained completely clean and sober from all alcohol and substance use was ${req.body.substanceUseValue?.remainedTreatmentCleanLongest}.`
              )
            : undefined,
          req.body.substanceUseValue?.enrolledTreatmentProgram === "Yes" &&
          req.body.substanceUseValue?.previouslyDescribedPsychiatricClean ===
            "Yes"
            ? storyParagraph(
                `While he was clean and sober, ${pronounPrefer} did continue to experience his psychiatric symptoms described above.`
              )
            : storyParagraph(
                `While he was clean and sober, ${pronounPrefer} did not continue to experience his psychiatric symptoms described above.`
              ),

          req.body.medicalHistoryValue?.diagnosedHealthcareProvider.length > 0
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} reported having medical conditions consisting of ${req.body.medicalHistoryValue?.diagnosedHealthcareProvider}.`
              )
            : storyParagraph(`${req.body.demographicInformation.fullName} denied suffering from any general medical conditions
        `),
          req.body.demographicInformation.radioSexItem === "Female"
            ? req.body.medicalHistoryValue?.pregnantPlanning === "Yes"
              ? storyParagraph(`${pronounPrefer} reports ${pronounPrefer} is currently pregnant.
        `)
              : req.body.medicalHistoryValue?.pregnantPlanning === "No"
              ? storyParagraph(
                  `${pronounPrefer} reports ${pronounPrefer} is not currently pregnant.`
                )
              : storyParagraph(
                  `${pronounPrefer} reports ${pronounPrefer} does not know if ${pronounPrefer} is currently pregnant.`
                )
            : undefined,
          req.body.demographicInformation.radioSexItem === "Female" &&
          req.body.medicalHistoryValue?.pregnantPlanning === "Yes"
            ? req.body.medicalHistoryValue?.plannedPregnancyProvider === "Yes"
              ? storyParagraph(
                  `${pronounPrefer} reports ${pronounPrefer} is currently engaged with a healthcare provider regarding ${pronounPrefer} pregnancy`
                )
              : storyParagraph(
                  `${pronounPrefer} reports ${pronounPrefer} is not currently engaged with a healthcare provider regarding ${pronounPrefer} pregnancy`
                )
            : undefined,

          storyParagraph(
            `${pronounPrefer} currently takes the following general medical medications: ${req.body.medicalHistoryValue?.physicalHealthMedicationsLists}.`
          ),
          req.body.medicalHistoryValue?.surgeries === "Yes"
            ? storyParagraph(`${pronounPrefer} has undergone surgery.`)
            : storyParagraph(`${pronounPrefer} has not undergone surgery.`),
          req.body.medicalHistoryValue?.surgeries === "Yes"
            ? storyParagraph(
                `consisting of ${req.body.medicalHistoryValue?.surgeriesDateList}`
              )
            : undefined,
          storyParagraph(
            `${pronoun} current general medical medications produce the following side effects ${req.body.medicalHistoryValue?.medicationsSideEffect}.`
          ),
          req.body.medicalHistoryValue?.futureMedicalPlan === "Yes"
            ? storyParagraph(
                `${pronoun} treatment providers have plans for #his future medical care.`
              )
            : storyParagraph(
                `${pronoun} treatment providers do not have plans for #his future medical care.`
              ),
          req.body.medicalHistoryValue?.futureMedicalPlan === "Yes"
            ? storyParagraph(
                `Future medical care planning for ${req.body.demographicInformation.fullName} consists of ${req.body.medicalHistoryValue?.futureMedicalPlanList}`
              )
            : undefined,
          storyParagraph(
            `${pronoun} current primary care provider is ${req.body.medicalHistoryValue?.currentPrimarycarePractitioner}`
          ),
          storyParagraph(
            `${pronoun} past primary care provider was  ${req.body.medicalHistoryValue.pastprimarycarePractitioner}.`
          ),
          storyParagraph(
            `${pronounPrefer} received this care as follows: ${req.body.medicalHistoryValue.periodReceiveProvider}`
          ),
          storyParagraph(
            `${pronounPrefer} described his hospitalization history as follows: ${req.body.medicalHistoryValue.hospitalListEverBeen}`
          ),
          storyParagraph(
            `${pronounPrefer} described his current medication treatment as follows: ${req.body.medicalHistoryValue.medicationsListTaking}`
          ),

          req.body.medicalHistoryValue?.allergiesMedication === "Yes"
            ? storyParagraph(
                `${pronounPrefer} suffers from allergies or intolerances to medication or food`
              )
            : storyParagraph(
                `${pronounPrefer} does not suffer from allergies or intolerances to medication or food`
              ),

          req.body.medicalHistoryValue?.allergiesMedication === "Yes"
            ? storyParagraph(
                `consisting of ${req.body.medicalHistoryValue?.allergiesList}.`
              )
            : undefined,

          req.body.familyHistoryValue?.familyPsychiatricConditions !== ""
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} reported a family history of psychiatric conditions, consisting of ${req.body.familyHistoryValue?.familyPsychiatricConditions}`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} denied any family history of psychiatric diagnoses`
              ),
          req.body.familyHistoryValue?.familyPsychiatricConditions === "Other"
            ? storyParagraph(
                `Additional psychiatric conditions ${pronoun} family members have been diagnosed with include ${req.body.familyHistoryValue?.psychiatricConditionsList}`
              )
            : undefined,
          req.body.familyHistoryValue?.familyPsychiatricConditions === "Other"
            ? storyParagraph(
                `with treatment consisting of ${req.body.familyHistoryValue?.psychiatricConditionsTreatment}`
              )
            : undefined,
          req.body.familyHistoryValue?.psychiatricConditionsTreatment === "Yes"
            ? storyParagraph(
                `${pronoun} family members have attempted or committed suicide.`
              )
            : storyParagraph(
                `${pronoun} family members have not attempted or committed suicide.`
              ),

          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} is currently involved in an intimate relationship.`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} is not currently involved in an intimate relationship.`
              ),

          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
            "Yes" &&
          req.body.relationshipHistoryValue?.currentlyMarried === "Yes"
            ? storyParagraph(`${pronoun} current marriage.`)
            : storyParagraph(
                `${pronoun} current significant intimate relationship.`
              ),
          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? storyParagraph(
                `has lasted ${req.body.relationshipHistoryValue.currentRelationshipInvolve}  ${req.body.relationshipHistoryValue?.currentlyUnit}.`
              )
            : undefined,
          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? storyParagraph(
                `${pronounPrefer} reported ${req.body.relationshipHistoryValue?.describeIntimateRelationship} in ${pronoun} current relationship.`
              )
            : undefined,
          req.body.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? storyParagraph(
                `${pronounPrefer} described the occupation of ${pronoun} significant other as follows: ${req.body.relationshipHistoryValue?.PartnerOccupation}`
              )
            : undefined,
          storyParagraph(
            `${pronounPrefer} has been married ${req.body.relationshipHistoryValue?.marriedNumber} times.`
          ),
          storyParagraph(
            `${pronounPrefer} reported a history of ${req.body.relationshipHistoryValue?.intimateRelationshipTimes} long term intimate relationships.`
          ),
          storyParagraph(
            `The longest relationship ${pronounPrefer} had lasted ${req.body.relationshipHistoryValue.longTermRelationshipsLast}.`
          ),
          storyParagraph(
            `${pronounPrefer} stated that ${pronoun} past relationships ended due to ${req.body.relationshipHistoryValue.reasonPreviousRelationships}.`
          ),
          req.body.relationshipHistoryValue?.domesticViolence === "Yes"
            ? storyParagraph(
                `${pronounPrefer} reported a history of domestic violence.`
              )
            : storyParagraph(
                `${pronounPrefer} denied a history of domestic violence.`
              ),

          req.body.relationshipHistoryValue?.haveChildren === "Yes"
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} has children.`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} does not have children.`
              ),

          req.body.relationshipHistoryValue?.haveChildren === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has ${req.body.relationshipHistoryValue.childrenNumberAndAge}`
              )
            : undefined,
          req.body.relationshipHistoryValue?.haveChildren === "Yes"
            ? storyParagraph(
                `${pronoun} children are doing ${req.body.relationshipHistoryValue?.childrenDoingSchool} in school or work.`
              )
            : undefined,
          req.body.relationshipHistoryValue?.haveChildren === "Yes"
            ? storyParagraph(
                `${pronoun} relationship with ${pronoun} children is ${req.body.relationshipHistoryValue?.relationshipChildren}`
              )
            : undefined,
          req.body.relationshipHistoryValue?.haveChildren === "Yes" &&
          req.body.relationshipHistoryValue?.childrenHealthIssues === "Yes"
            ? storyParagraph(
                `${pronoun} children have general or mental health issues.`
              )
            : storyParagraph(
                `${pronoun} children do not have general or mental health issues.`
              ),

          storyParagraph(
            `${req.body.demographicInformation.fullName} reported that his current employment status is ${req.body.employmentHistoryValue?.currentEmploymentStatus}`
          ),
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed <20 hours per week" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed >20 hours per week, but not full time" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed full time"
            ? storyParagraph(
                `at ${req.body.employmentHistoryValue?.employerName}`
              )
            : undefined,
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed <20 hours per week" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed >20 hours per week, but not full time" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed full time"
            ? storyParagraph(
                `as a ${req.body.employmentHistoryValue?.employmentTitle}`
              )
            : undefined,
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed <20 hours per week" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed >20 hours per week, but not full time" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed full time"
            ? storyParagraph(
                `${pronoun} employment duties include ${req.body.employmentHistoryValue?.jobDuties}`
              )
            : undefined,
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed <20 hours per week" ||
          req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed >20 hours per week, but not full time" ||
          (req.body.employmentHistoryValue?.currentEmploymentStatus ===
            "Employed full time" &&
            req.body.employmentHistoryValue?.difficultyJobDuties === "Yes")
            ? storyParagraph(
                `${pronounPrefer} does have difficuilty performing ${pronoun} job duties.`
              )
            : storyParagraph(
                `${pronounPrefer} does not have difficuilty performing ${pronoun} job duties.`
              ),

          storyParagraph(
            `${req.body.demographicInformation.fullName} began ${pronoun} past employment at ${req.body.employmentHistoryValue.pastEmployerName}`
          ),
          storyParagraph(`as a ${req.body.employmentHistoryValue.jobTitle}`),
          storyParagraph(
            `from ${req.body.employmentHistoryValue.pastEmploymentBegan}`
          ),
          storyParagraph(
            `to ${req.body.employmentHistoryValue.pastEmploymentEnd}`
          ),
          storyParagraph(
            `${pronounPrefer} ended this employment due to ${req.body.employmentHistoryValue.pastEmploymentEndReason}.`
          ),

          req.body.employmentHistoryValue?.pastWorkplaceInjuries === "Yes"
            ? storyParagraph(
                `${pronounPrefer} reported a history of workplace injury`
              )
            : storyParagraph(
                `${pronounPrefer} denied any history of workplace injury`
              ),
          req.body.employmentHistoryValue?.pastWorkplaceInjuries === "Yes"
            ? storyParagraph(
                `In ${req.body.employmentHistoryValue?.injuriesOccurTime}`
              )
            : undefined,
          req.body.employmentHistoryValue?.pastWorkplaceInjuries === "Yes"
            ? storyParagraph(
                `${pronoun} injury consisted of the following:${req.body.employmentHistoryValue?.injuryNature} `
              )
            : undefined,

          req.body.employmentHistoryValue?.workerCompensationClaim === "Yes"
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} reported a history of submitting (a) Workers’ Compensation claim(s).`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} denied ever submitting a Workers’ Compensation claim`
              ),
          req.body.employmentHistoryValue?.placedDisability === "Yes"
            ? storyParagraph(
                `${pronounPrefer} reported a history of being placed on disability.`
              )
            : storyParagraph(`${pronounPrefer} denied ever submitting`),

          req.body.employmentHistoryValue?.receivedNegativeWork === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has received negative work evaluations, terminations, or disciplinary action for`
              )
            : storyParagraph(
                `${pronounPrefer} has never received negative work evaluations, terminations, or disciplinary action`
              ),

          storyParagraph(
            ` described his other employment as: ${req.body.employmentHistoryValue?.otherEmploymentList}`
          ),

          storyParagraph(
            `${req.body.demographicInformation.fullName}'s highest education level is ${req.body.educationHistoryValue?.highestLevelEducation}`
          ),
          req.body.educationHistoryValue.highestLevelEducation ===
          "Currently a student"
            ? storyParagraph(
                `${pronounPrefer} described ${pronoun} current education program as consisting of the following: ${req.body.educationHistoryValue?.currentlyEnrolledEducation}`
              )
            : undefined,
          storyParagraph(
            `${pronounPrefer} reported that ${pronounPrefer} received mostly ${req.body.educationHistoryValue?.mostlyReceiveGrade} throughout ${pronoun} education`
          ),

          req.body.educationHistoryValue.learningDisability === "Yes"
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} reported a history of having learning disabilities or being placed in special education classes.`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} denied any history of having learning disabilities or being placed in special education classes`
              ),
          req.body.educationHistoryValue.learningDisability === "Yes"
            ? storyParagraph(
                `consisting of ${req.body.educationHistoryValue?.describeLearningDifficulties}`
              )
            : undefined,
          req.body.educationHistoryValue.graduateHighSchool === "Yes"
            ? storyParagraph(`${pronounPrefer} Graduated High School.`)
            : storyParagraph(`${pronounPrefer} did not graduate High School.`),
          req.body.educationHistoryValue.graduateHighSchool === "Yes"
            ? req.body.educationHistoryValue?.graduateOnTime === "Yes"
              ? storyParagraph(`${pronounPrefer} graduated on time on time`)
              : storyParagraph(
                  `${pronounPrefer} did not graduate on time on time`
                )
            : undefined,
          req.body.educationHistoryValue.goToCollege === "Yes"
            ? storyParagraph(`${pronounPrefer} attended college`)
            : storyParagraph(`${pronounPrefer} did not attend college`),

          req.body.educationHistoryValue.goToCollege === "Yes"
            ? req.body.educationHistoryValue?.completeYourDegree === "Yes"
              ? storyParagraph(`${pronounPrefer} completed a degree.`)
              : storyParagraph(`${pronounPrefer} did not complete a degree.`)
            : undefined,
          req.body.educationHistoryValue.goToCollege === "Yes"
            ? storyParagraph(`${pronounPrefer} attended college`)
            : undefined,

          req.body.educationHistoryValue.goToCollege === "Yes"
            ? storyParagraph(
                `${pronounPrefer} attended ${req.body.educationHistoryValue?.collegeName}`
              )
            : undefined,
          req.body.educationHistoryValue.goToCollege === "Yes"
            ? storyParagraph(
                `and studied ${req.body.educationHistoryValue?.collegeMajor}`
              )
            : undefined,

          req.body.socialHistoryValue?.barriersReceivingHealthcare === "Yes"
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} is experiencing barriers to receiving healthcare`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} is not experiencing barriers to receiving healthcare`
              ),
          req.body.socialHistoryValue?.barriersReceivingHealthcare === "Yes"
            ? storyParagraph(
                `consisting of ${req.body.socialHistoryValue?.selectbarriersHealthcare}`
              )
            : undefined,
          storyParagraph(
            `${pronoun} current living situation consists of ${req.body.socialHistoryValue?.describeCurrentLivingSituation}`
          ),
          req.body.socialHistoryValue?.describeCurrentLivingSituation.length !==
            0 &&
          req.body.socialHistoryValue?.describeCurrentLivingSituation.filter(
            (item) => item !== "Homeless" && item !== "Other"
          ).length > 0
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} lives in ${req.body.socialHistoryValue?.describeCurrentLivingSituation} with ${pronoun} ${req.body.socialHistoryValue?.livesYourHome}`
              )
            : undefined,

          req.body.socialHistoryValue?.describeCurrentLivingSituation.length !==
            0 &&
          req.body.socialHistoryValue?.describeCurrentLivingSituation.filter(
            (item) => item !== "Homeless" && item !== "Other"
          ).length > 0
            ? storyParagraph(
                `${pronounPrefer} has lived in this home for the last ${req.body.socialHistoryValue?.residedCurrentHomeLong} years.`
              )
            : undefined,
          req.body.socialHistoryValue?.describeCurrentLivingSituation.length !==
            0 &&
          req.body.socialHistoryValue?.describeCurrentLivingSituation.filter(
            (item) => item !== "Homeless" && item !== "Other"
          ).length > 0
            ? req.body.socialHistoryValue?.ownYourHome === "Yes"
              ? storyParagraph(`${pronounPrefer} owns ${pronoun} home.`)
              : storyParagraph(`${pronounPrefer} does not own ${pronoun} home.`)
            : undefined,
          req.body.socialHistoryValue?.describeCurrentLivingSituation.length !==
            0 &&
          req.body.socialHistoryValue?.describeCurrentLivingSituation.filter(
            (item) => item !== "Homeless" && item !== "Other"
          ).length > 0
            ? storyParagraph(
                `${pronounPrefer} is experiencing additional stressors in ${pronoun} life [consisting of ${req.body.socialHistoryValue?.describeAdditionalStressors}.`
              )
            : undefined,
          req.body.socialHistoryValue?.presentTimeDanger === "Yes"
            ? storyParagraph(
                `${pronounPrefer} feels in any danger at the present time.`
              )
            : storyParagraph(
                `${pronounPrefer} does not feel in any danger at the present time.`
              ),
          storyParagraph(
            `${pronounPrefer} described the stressors that are related to work that occurred in the past year as follows: ${req.body.socialHistoryValue.allStressorsPastYear}`
          ),
          req.body.socialHistoryValue?.stressorsAffect === "Yes"
            ? storyParagraph(
                `These stressors contributed to ${pronoun} emotional symptoms`
              )
            : storyParagraph(
                `These stressors did not contribute to ${pronoun} emotional symptoms`
              ),
          storyParagraph(
            `in the following ways: ${req.body.socialHistoryValue.eachStressorsAffect} `
          ),

          req.body.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? storyParagraph(`${pronounPrefer} reported additional stressors.`)
            : storyParagraph(`${pronounPrefer} denied additional stressors.`),

          req.body.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? storyParagraph(
                `The additional stressors he has experienced consisted of ${req.body.socialHistoryValue?.explainAllStressors}`
              )
            : undefined,
          req.body.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? req.body.socialHistoryValue?.affectEmotionalSymptoms === "Yes"
              ? storyParagraph(
                  `These stressors contributed to ${pronoun} emotional symptoms`
                )
              : storyParagraph(
                  `These stressors did not contribute to ${pronoun} emotional symptoms`
                )
            : undefined,
          req.body.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? storyParagraph(
                `in the following ways: ${req.body.socialHistoryValue?.eachAffectEmotionalSymptoms}`
              )
            : undefined,

          req.body.socialHistoryValue?.otherStressorsExperience === "Yes"
            ? storyParagraph(
                `${pronounPrefer} is experiencing any other stressors.`
              )
            : storyParagraph(
                `${pronounPrefer} is not experiencing any other stressors.`
              ),

          req.body.criminalHistoryValue?.arrested === "Yes"
            ? storyParagraph(`${pronounPrefer} reported a history of arrests`)
            : storyParagraph(
                `${pronounPrefer} denied any history of criminal behavior or arrests`
              ),

          req.body.criminalHistoryValue?.arrested === "Yes"
            ? storyParagraph(
                `for the charges of ${req.body.criminalHistoryValue?.charges}`
              )
            : undefined,
          req.body.criminalHistoryValue?.arrested === "Yes"
            ? storyParagraph(
                `${pronoun} past sentences lasted ${req.body.criminalHistoryValue?.everIncarcerated}}`
              )
            : undefined,

          req.body.criminalHistoryValue?.arrested === "Yes"
            ? req.body.criminalHistoryValue?.currentlyParole === "Yes"
              ? storyParagraph(
                  `${pronounPrefer} is currently on parol or probation.`
                )
              : storyParagraph(
                  `${pronounPrefer} is not currently on parol or probation.`
                )
            : undefined,

          req.body.violenceHistoryValue?.physicalAltercations === "Yes"
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} reported a history of physical violence`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} denied any history of physical altercations or violence`
              ),

          req.body.violenceHistoryValue?.physicalAltercations === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has been involved in ${req.body.violenceHistoryValue?.altercationsTimes}`
              )
            : undefined,
          req.body.violenceHistoryValue?.physicalAltercations === "Yes"
            ? storyParagraph(
                `physical altercations in #his lifetime. These altercations were due to ${req.body.violenceHistoryValue?.circumstancesSurrounding}.`
              )
            : undefined,
          req.body.violenceHistoryValue?.thoughtsHurtAnyone === "Yes"
            ? storyParagraph(
                `${pronounPrefer} endorses having thoughts of wanting to hurt anyone..`
              )
            : storyParagraph(
                `${pronounPrefer} denies having thoughts of wanting to hurt anyone..`
              ),

          req.body.violenceHistoryValue?.victimViolence === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has been the victim of violence.`
              )
            : storyParagraph(
                `${pronounPrefer} has not been the victim of violence.`
              ),

          req.body.violenceHistoryValue?.victimViolence === "Yes"
            ? req.body.violenceHistoryValue?.currentlyDangerViolence === "Yes"
              ? storyParagraph(
                  `${pronounPrefer} is currently in danger of violence.`
                )
              : storyParagraph(
                  `${pronounPrefer} is not currently in danger of violence.`
                )
            : undefined,

          req.body.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? storyParagraph(
                `${req.body.demographicInformation.fullName} reported a history of enlisting in the military consisting of ${req.body.militaryHistoryValue?.branchMilitary} from ${req.body.militaryHistoryValue?.militaryDatesFrom} to ${req.body.militaryHistoryValue?.militaryDatesTo} as a ${req.body.militaryHistoryValue?.militaryJob}`
              )
            : storyParagraph(
                `${req.body.demographicInformation.fullName} denied a history of enlisting in the military`
              ),

          req.body.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? storyParagraph(
                `${pronounPrefer} was ${req.body.militaryHistoryValue?.dischargeStatus} discharged.`
              )
            : undefined,

          storyParagraph(
            `${req.body.demographicInformation.fullName} awakens on work days at ${req.body.currentDailyActivitiesValue?.awakenTimeWorkDays}`
          ),
          storyParagraph(
            `${pronounPrefer} awakens on non-work days at ${req.body.currentDailyActivitiesValue?.awakenTimeNotWorkDays}`
          ),
          storyParagraph(
            `${pronounPrefer} typically goes to bed at ${req.body.currentDailyActivitiesValue?.goToBed}`
          ),
          storyParagraph(
            `and falls asleep at ${req.body.currentDailyActivitiesValue?.fallAsleepTime}`
          ),
          storyParagraph(
            `${req.body.demographicInformation.fullName} described ${pronoun} activites from 6 a.m. to 8 a.m as ${req.body.currentDailyActivitiesValue.do6am};`
          ),
          storyParagraph(
            `from 8 a.m. to 10 a.m as ${req.body.currentDailyActivitiesValue.do8am}`
          ),
          storyParagraph(
            `from 10 a.m. to 12 p.m. as ${req.body.currentDailyActivitiesValue.do10am}`
          ),
          storyParagraph(
            `from 12 p.m. to 2 p.m as ${req.body.currentDailyActivitiesValue.do12pm}`
          ),
          storyParagraph(
            `from 2 p.m. to 4 p.m as ${req.body.currentDailyActivitiesValue.do2pm}`
          ),
          storyParagraph(
            `from 4 p.m. to 6 p.m. as ${req.body.currentDailyActivitiesValue.do4pm}`
          ),
          storyParagraph(
            `from 6 p.m. to 8 p.m as ${req.body.currentDailyActivitiesValue.do6pm}`
          ),
          storyParagraph(
            `from 8 p.m. to 10 p.m. as ${req.body.currentDailyActivitiesValue.do8pm}`
          ),
          storyParagraph(
            `from 10 p.m. to 12 p.m. or to bedtime as ${req.body.currentDailyActivitiesValue.do10pm}`
          ),
          storyParagraph(
            `and from 12 p.m. to 6 a.m as ${req.body.currentDailyActivitiesValue.do12p6am}`
          ),
          storyParagraph(
            `${req.body.demographicInformation.fullName} leisure activities or hobbies as ${req.body.currentDailyActivitiesValue?.leisureActivities}.`
          ),
          storyParagraph(
            `${
              req.body.demographicInformation.fullName
            } endorsed  any difficulties performing the following tasks ${objectCardType(
              req.body.currentDailyActivitiesValue?.troubleFollowing
            )}`
          ),
          storyParagraph(
            `${
              req.body.demographicInformation.fullName
            } endorsed  any difficulties performing the following tasks ${objectCardType(
              req.body.currentDailyActivitiesValue?.dailyLivingFollowing
            )}`
          ),
          storyParagraph(
            `${
              req.body.demographicInformation.fullName
            } described ${objectCardType(
              req.body.currentDailyActivitiesValue.difficultAmount
            )}`
          ),

          storyParagraph(
            `${req.body.demographicInformation.fullName} reported that #he was born in ${req.body.developmentalValue?.bornPlace}`
          ),
          storyParagraph(
            `and raised in ${req.body.developmentalValue?.primarilyRaised}.`
          ),
          storyParagraph(
            `${pronounPrefer} was raised by ${pronoun} ${req.body.developmentalValue?.raisedChilhood}`
          ),
          storyParagraph(
            `${pronounPrefer} was raised by ${req.body.developmentalValue.describeRelationshipPerson}`
          ),
          storyParagraph(
            `${pronounPrefer} described ${pronoun} relationship with the primary adults who raised ${prepositionPronoun} when ${pronounPrefer} was a child as ${req.body.developmentalValue?.relationshipPrimaryAdults}`
          ),
          req.body.developmentalValue?.haveSiblings === "Yes"
            ? storyParagraph(`${pronounPrefer} has`)
            : storyParagraph(`${pronounPrefer} does not have any`),
          req.body.developmentalValue?.haveSiblings === "Yes"
            ? storyParagraph(
                `${pronounPrefer} has ${req.body.developmentalValue?.siblingsMany} siblings.`
              )
            : undefined,
          req.body.developmentalValue?.haveSiblings === "Yes"
            ? storyParagraph(
                `${pronounPrefer} was raised with all ${req.body.developmentalValue?.siblingsRaised} of them.`
              )
            : undefined,
          req.body.developmentalValue?.haveSiblings === "Yes"
            ? storyParagraph(
                `${pronounPrefer} describes ${pronoun} relationship with ${pronoun} siblings as ${req.body.developmentalValue?.relationshipSiblings}`
              )
            : undefined,
          storyParagraph(
            `${pronounPrefer} reported any history of "${req.body.developmentalValue?.experienceAbuseChildhood}"`
          ),

          req.body.developmentalValue?.parentsMarried === "Yes"
            ? storyParagraph(`${pronoun} parents were married`)
            : storyParagraph(`${pronoun} parents never married`),
          req.body.developmentalValue?.parentsMarried === "Yes"
            ? req.body.developmentalValue?.parentsRemainMarried === "Yes"
              ? storyParagraph(`${pronoun} parents remained married`)
              : undefined
            : undefined,
          req.body.developmentalValue?.parentsMarried === "Yes"
            ? storyParagraph(`${req.body.developmentalValue?.parentsDivorce}`)
            : undefined,
          req.body.developmentalValue?.parentsMarried === "Yes"
            ? storyParagraph(
                `${pronounPrefer} was ${req.body.developmentalValue?.yourOldParentsDivorced} years old when ${pronoun} parents divorced or separated.`
              )
            : undefined,

          req.body.developmentalValue?.motherWork === "Yes"
            ? storyParagraph(
                `${pronoun} mother was employed as a ${req.body.developmentalValue?.motherJob}`
              )
            : undefined,
          req.body.developmentalValue?.motherWork === "Yes"
            ? storyParagraph(`${req.body.developmentalValue?.motherStillWork}`)
            : undefined,

          req.body.developmentalValue?.motherCurrentLiving === "Yes"
            ? storyParagraph(`${pronoun} mother is currently living.`)
            : storyParagraph(`${pronoun} mother is currently deceased.`),
          req.body.developmentalValue?.motherCurrentLiving === "No"
            ? storyParagraph(
                `She died when she was ${req.body.developmentalValue?.diedMotherOld}`
              )
            : undefined,
          req.body.developmentalValue?.motherCurrentLiving === "No"
            ? storyParagraph(
                `from ${req.body.developmentalValue?.whatDiedMother}`
              )
            : undefined,

          req.body.developmentalValue?.fatherWork === "Yes"
            ? storyParagraph(
                `${pronoun} father was employed as a ${req.body.developmentalValue?.fatherJob}`
              )
            : undefined,
          req.body.developmentalValue?.fatherWork === "Yes"
            ? storyParagraph(`${req.body.developmentalValue?.fatherStillWork}`)
            : undefined,

          req.body.developmentalValue?.fatherCurrentLiving === "Yes"
            ? storyParagraph(`${pronoun} father is currently living.`)
            : storyParagraph(`${pronoun} father is currently deceased.`),
          req.body.developmentalValue?.fatherCurrentLiving === "No"
            ? storyParagraph(
                `he died when he was ${req.body.developmentalValue?.diedFatherOld}`
              )
            : undefined,
          req.body.developmentalValue?.fatherCurrentLiving === "No"
            ? storyParagraph(
                `from ${req.body.developmentalValue?.whatDiedFather}`
              )
            : undefined,
          storyParagraph(
            `${pronounPrefer} was ${socialLife(
              req.body.developmentalValue?.bestDescribesSocialLifeChild
            )}`
          ),
          storyParagraph(
            `As a child ${pronounPrefer} enjoyed ${req.body.developmentalValue?.enjoyActivitiesChild}.`
          ),

          storyParagraph(
            `${pronounPrefer} also states ${req.body.additionalValue?.evaluatingClinician}`
          ),
          storyParagraph(
            `${pronounPrefer} also states ${req.body.additionalValue?.yourAdditionalInformation}`
          ),
        ],
      },
    ],
  });
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const file1Name = `story_${year}-${month}-${day}.docx`;
  const file2Name = `question_${year}-${month}-${day}.docx`;

  const zipFileName = `Doc_${year}-${month}-${day}-${uuidv4()}.zip`;
  const file1Path = path.join(__dirname, "../../downloads", file1Name);

  const file2Path = path.join(__dirname, "../../downloads", file2Name);

  const zipFilePath = path.join(__dirname, "../../downloads", zipFileName);
  const zip = new JSZip();

  await Promise.all([Packer.toBuffer(storyDoc), Packer.toBuffer(doc)])
    .then(async ([file1Data, file2Data]) => {
      zip.file(file1Name, file1Data);
      zip.file(file2Name, file2Data);

      zip.generateAsync({ type: "nodebuffer" }).then(function (content) {
        fs.writeFileSync(zipFilePath, content);
      });
      res.json(zipFileName);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Internal server error");
    });
});

module.exports = router;
