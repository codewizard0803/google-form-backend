/** @format */

const express = require("express");
const router = express.Router();
const {
  Document,
  Packer,
  HeadingLevel,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableCell,
  TableRow,
  TextUnderlineType,
} = require("docx");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const JSZip = require("jszip");
const Doc = require("../../modal/doc");

router.get("/", (req, res) => res.send("GenerateDocFile!"));

router.post("/", async (req, res) => {
  const TitleParagraph = (value) => {
    return new Paragraph({
      text: value,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      textRun: {
        bold: true,
        font: "Times New Roman",
        size: 24,
      },
    });
  };

  const TitleStoryParagraph = (value) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: value,
          bold: true,
          size: 24,
          color: "000000",
          font: "Times New Roman",
          alignment: AlignmentType.LEFT,
        }),
      ],
    });
  };

  const questionParagraph = (question) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: question,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    });
  };

  const employerList = (value) => {
    return value
      .map(
        (item, index) =>
          `${index + 1}. ` +
          Object.keys(item).map((p) => `${p}` + ":" + `${item[p]}`) +
          `${"\n"}`
      )
      .join(" ");
  };

  const divideArray = (value) => {
    if (value.length === 0) {
      return "";
    }
    if (value.length === 1) {
      return value[0];
    }

    if (value.length === 2) {
      return value[0] + " and " + value[1];
    }

    const lastElement = ", and " + value[value.length - 1];

    const elements = value
      .slice(0, -1)
      .map((element) => element)
      .join(", ");

    return elements + lastElement;
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
        scorelevel = "moderate-severe";
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
          font: "Times New Roman",
          size: 24,
          color: "#119795",
        }),
      ],
    });
  };

  const employerHeader = [
    "Employer (begin with your first job)",
    "Your Job Title",
    "Dates you started/left this Employment",
    "Reason You Left This Job",
  ];

  const tableHeaderRow = new TableRow({
    children: employerHeader.map(
      (header) => new TableCell({ children: [new Paragraph(header)] })
    ),
  });

  const bodyRows = (value) => {
    return value.map((row) => {
      const { employer, jobTitle, datesOfEmployment, reasonForLeaving } = row;
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(employer)] }),
          new TableCell({ children: [new Paragraph(jobTitle)] }),
          new TableCell({ children: [new Paragraph(datesOfEmployment)] }),
          new TableCell({ children: [new Paragraph(reasonForLeaving)] }),
        ],
      });
    });
  };
  const table = (value) => {
    return new Table({
      rows: [tableHeaderRow, ...bodyRows(value)],
    });
  };

  const cardFieldType = (value) => {
    return value.map((item) => `${item.condition}:${item.effect}`).join(", ");
  };

  const formatMedication = (value) => {
    const outPut = value.map(
      ({ condition, effect }) =>
        `${effect.slice(0, effect?.length - 8)}${condition} symptoms`
    );
    if (outPut.length === 1) {
      return outPut;
    } else if (outPut.length === 2) {
      return outPut[0] + " and " + outPut[1];
    } else {
      const lastItemIndex = outPut.length - 1;
      if (lastItemIndex >= 0) {
        outPut[lastItemIndex] = "and " + outPut[lastItemIndex];
      }
      return outPut.join(", ");
    }
  };

  const formatCurrentlySubstance = (value) => {
    if (value.length === 0) {
      return "";
    }
    if (value.length === 1) {
      return value[0].condition + " " + value[0].effect;
    }
    if (value.length === 2) {
      return (
        value[0].condition +
        " " +
        value[0].effect +
        " and " +
        value[1].condition +
        " " +
        value[1].effect
      );
    }

    const lastElement =
      ", and " +
      value[value.length - 1].condition +
      " " +
      value[value.length - 1].effect;
    let elements = value
      .slice(0, -1)
      .map((item, index) => {
        return `${item.condition} ${item.effect}`;
      })
      .join(", ");

    return elements + lastElement;
  };

  const formatRegardingAlcoholAnyFollowing = (value) => {
    let lastElement = "";
    if (value.length - 1) {
      if (
        value[value.length - 1] ===
        "tolerance as defined by either of the following"
      ) {
        lastElement = ", and tolerance";
      } else if (
        value[value.length - 1] ===
        "withdrawal as manifested by either of the following"
      ) {
        lastElement = ", and characteristic withdrawal symptoms";
      } else {
        lastElement = ", and " + item;
      }
    }
    let elements = value
      .slice(0, -1)
      .map((item, index) => {
        if (item === "tolerance as defined by either of the following") {
          return "tolerance";
        } else if (
          item === "withdrawal as manifested by either of the following"
        ) {
          return "characteristic withdrawal symptoms";
        } else {
          return item;
        }
      })
      .join(", ");

    return elements + lastElement;
  };

  const cardField = (value) => {
    let outPut = value.map((item, index) => {
      if (index === value.length - 2) {
        return `${item.condition} was ${item.effect}`;
      } else if (index === value.length - 1) {
        return ` and ${item.condition} was ${item.effect}`;
      } else {
        return `${item.condition} was ${item.effect}`;
      }
    });

    return outPut;
  };

  const formatPastPsychiatricMedication = (value) => {
    let pastPsychiatric = "";
    if (value.length === 1) {
      pastPsychiatric = `for ${value[0].condition}, ${value[0].effect}`;
    } else if (value.length === 2) {
      pastPsychiatric = `for ${value[0].condition}, ${value[0].effect} and for ${value[1].condition}, ${value[1].effect}`;
    } else {
      pastPsychiatric = value.map((item, index) => {
        if (index === value.length - 2) {
          return `for ${item.condition}, ${item.effect}`;
        } else if (index === value.length - 1) {
          return `and for ${item.condition}, ${item.effect}`;
        } else {
          return `for ${item.condition}, ${item.effect}, `;
        }
      });
    }
    return pastPsychiatric;
  };

  const formatNumber = (value) => {
    const numValue = parseInt(value);
    if (numValue >= 1 && numValue <= 20) {
      switch (numValue) {
        case 1:
          return "one";
        case 2:
          return "two";
        case 3:
          return "three";
        case 4:
          return "four";
        case 5:
          return "five";
        case 6:
          return "six";
        case 7:
          return "seven";
        case 8:
          return "eight";
        case 9:
          return "nine";
        case 10:
          return "ten";
        case 11:
          return "eleven";
        case 12:
          return "twelve";
        case 13:
          return "thirteen";
        case 14:
          return "fourteen";
        case 15:
          return "fifteen";
        case 16:
          return "sixteen";
        case 17:
          return "seventeen";
        case 18:
          return "eighteen";
        case 19:
          return "nineteen";
        case 20:
          return "twenty";
      }
    } else if (numValue > 20 && numValue <= 99) {
      const tens = Math.floor(numValue / 10);
      const ones = numValue % 10;
      let result = "";

      switch (tens) {
        case 2:
          result += "twenty";
          break;
        case 3:
          result += "thirty";
          break;
        case 4:
          result += "forty";
          break;
        case 5:
          result += "fifty";
          break;
        case 6:
          result += "sixty";
          break;
        case 7:
          result += "seventy";
          break;
        case 8:
          result += "eighty";
          break;
        case 9:
          result += "ninety";
          break;
      }

      if (ones > 0) {
        result += "-" + formatNumber(ones);
      }
      return result;
    } else {
      return;
    }
  };

  const objectCardType = (value) => {
    return value
      .map((item) => `${Object.keys(item)}: ${item[Object.keys(item)]}`)
      .join(", ");
  };

  const regardingAlcohol = (value1, value2, value3) => {
    let newItem = [...value1];

    if (
      value1.filter(
        (item) => item === "tolerance as defined by either of the following"
      ).length > 0
    ) {
      newItem = newItem.map((item) =>
        item === "tolerance as defined by either of the following"
          ? "tolerance as defined by either of the following: " + value2
          : item
      );
    }

    if (
      value1.filter(
        (item) => item === "withdrawal as manifested by either of the following"
      ).length > 0
    ) {
      newItem = newItem.map((item) =>
        item === "withdrawal as manifested by either of the following"
          ? "withdrawal as manifested by either of the following: " + value3
          : item
      );
    }

    return newItem;
  };

  const storyParagraph = (value) => {
    const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);

    return new Paragraph({
      children: [
        new TextRun({
          text: capitalizedValue,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    });
  };

  const storyLine = (value) => {
    const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);

    return new TextRun({
      text: capitalizedValue,
      font: "Times New Roman",
      size: 24,
    });
  };

  const storyLowCaseLine = (value) => {
    return new TextRun({
      text: value,
      font: "Times New Roman",
      size: 24,
    });
  };

  const createTextRuns = (lines) => {
    return lines.map((line) => {
      const capitalizedLine = line.charAt(0).toUpperCase() + line.slice(1);
      return storyLine(capitalizedLine);
    });
  };

  const createTextLowerRuns = (lines) => {
    return lines.map((line) => {
      const lowerCaseLine = line.charAt(0).toLowerCase() + line.slice(1);

      return storyLowCaseLine(lowerCaseLine);
    });
  };

  const formatEachSubstance = (value) => {
    if (value.length === 0) {
      return "";
    }
    if (value.length === 1) {
      return value[0].condition + " in the amount of " + value[0].effect;
    }
    if (value.length === 2) {
      return (
        value[0].condition +
        " in the amount of " +
        value[0].effect +
        " and " +
        value[1].condition +
        " in the amount of " +
        value[1].effect
      );
    }

    const lastElement =
      ", and " +
      value[value.length - 1].condition +
      " in the amount of " +
      value[value.length - 1].effect;
    let elements = value.slice(0, -1).map((item, index) => {
      return `${item.condition} in the amount of ${item.effect}`;
    });

    return elements + lastElement;
  };

  const formatSubstanceListStartedOld = (value, pronounPrefer) => {
    if (value.length === 0) {
      return "";
    }
    if (value.length === 1) {
      return `${pronounPrefer} was ${value[0].effect} when ${pronounPrefer} started using ${value[0].condition}`;
    }
    if (value.length === 2) {
      return `${pronounPrefer} was ${value[0].effect} when ${pronounPrefer} started using ${value[0].condition} and ${pronounPrefer} was ${value[1].effect} when ${pronounPrefer} started using ${value[1].condition}`;
    }
    const lastElement =
      ", and " +
      pronounPrefer +
      " was " +
      value[value.length - 1].effect +
      " when " +
      pronounPrefer +
      " started using " +
      value[value.length - 1].condition;

    let elements = value.slice(0, -1).map((item, index) => {
      return `${pronounPrefer} was ${item.effect} when ${pronounPrefer} started using ${item.condition}`;
    });

    return elements + lastElement;
  };

  const formatToleranceFollowingSubstances = (value) => {
    let outPutYes = "";
    let outPutNo = "";
    let outPut = "";
    let toleranceFollwingYes = [];
    let toleranceFollwingNo = [];

    value.map(({ condition, effect }) => {
      if (effect === "Yes") {
        toleranceFollwingYes.push(condition);
      } else {
        toleranceFollwingNo.push(condition);
      }
    });

    if (toleranceFollwingYes.length > 0) {
      outPutYes =
        `has experienced a history of tolerance to ` +
        toleranceFollwingYes.join(", ");
    }

    if (toleranceFollwingNo.length > 0) {
      outPutNo = `has not to ` + toleranceFollwingNo.join(", ");
    }

    if (outPutYes !== "" && outPutNo !== "") {
      outPut = outPutYes + " and " + outPutNo;
    } else if (outPutYes !== "" && outPutNo == "") {
      outPut = outPutYes;
    } else if (outPutYes === "" && outPutNo !== "") {
      outPut = outPutNo;
    }

    return outPut;
  };

  const formatWithdrawalFollowingSubstances = (value) => {
    let outPutYes = "";
    let outPutNo = "";
    let outPut = "";
    let WithdrawalFollwingYes = [];
    let WithdrawalFollwingNo = [];

    value.map(({ condition, effect }) => {
      if (effect === "Yes") {
        WithdrawalFollwingYes.push(condition);
      } else {
        WithdrawalFollwingNo.push(condition);
      }
    });

    if (WithdrawalFollwingYes.length > 0) {
      outPutYes =
        `has experienced a history of withdrawal to ` +
        WithdrawalFollwingYes.join(", ");
    }

    if (WithdrawalFollwingNo.length > 0) {
      outPutNo = `has not to ` + WithdrawalFollwingNo.join(", ");
    }

    if (outPutYes !== "" && outPutNo !== "") {
      outPut = outPutYes + " and " + outPutNo;
    } else if (outPutYes !== "" && outPutNo == "") {
      outPut = outPutYes;
    } else if (outPutYes === "" && outPutNo !== "") {
      outPut = outPutNo;
    }

    return outPut;
  };

  const formatDate = (value) => {
    const date = new Date(value);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = monthNames[date.getMonth()];

    const day = date.getDate();

    const year = date.getFullYear();
    const output = `${month} ${day}, ${year}`;

    return output;
  };

  const subHeading = (value) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: value,
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    });
  };

  const storyLowCaseParagraph = (value) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: value,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    });
  };

  const shePreferPronoun =
    req.body?.demographicInformation?.radioPreferPronounItem ===
      "she/her/hers" ||
    req.body?.demographicInformation?.radioPreferPronounItem === "Ze" ||
    req.body?.demographicInformation?.radioPreferPronounItem === "Hir";
  const validateBoolean = (value) => {
    let isValid = false;
    if (value === "Yes") {
      isValid = true;
    } else {
      isValid = false;
    }

    return isValid;
  };

  const formatAge = (value) => {
    let bornYear = value.slice(0, 4);
    let d = new Date();
    let year = d.getFullYear();

    return year - bornYear;
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
  const surname = shePreferPronoun ? "Ms. " : "Mr. ";

  const prepositionPronoun = shePreferPronoun ? "her" : "him";

  const formatExperienceFollowing = (pron, prefer, value) => {
    let experience = value
      .map((item, index) => {
        if (
          item ===
          "felt like people you don't know are talking about you or following you"
        ) {
          return `${prefer} has felt like people ${prefer} doesn't know are talking about ${pron} or following ${pron}`;
        } else if (item === "heard a voice that no one else hears") {
          return prefer + " has " + item;
        } else if (
          item ===
          "had thoughts, behaviors, or rituals that are recurrent, intrusive, and time consuming"
        ) {
          return prefer + " " + item;
        } else {
          return item;
        }
      })
      .join(", ");

    return experience;
  };

  const stopedMedicationReason = (pron, prefer, value) => {
    let output = value
      .map((item, index) => {
        if (item === "felt the medication was no longer needed") {
          return prefer + " " + item;
        } else if (item === "psychiatric symptoms had resolved") {
          return pron + " " + item;
        } else {
          return item;
        }
      })
      .join(", ");

    const lastIndex = output.lastIndexOf(", ");
    if (lastIndex !== -1) {
      output =
        output.substring(0, lastIndex) +
        ", and " +
        output.substring(lastIndex + 2);
    }
    return output;
  };

  const formatCurrentLivingSituation = (pron, value) => {
    let output = value
      .map((item, index) => {
        if (item === "owning own home") {
          return `owning ${pron} own home, `;
        } else if (index === value.length - 2) {
          return item;
        } else if (index === value.length - 1) {
          return "and " + item;
        } else {
          return item + ", ";
        }
      })
      .join(" ");

    return output;
  };

  const formatTroubleFollowing = (value) => {
    let result = "";
    const filteredObjects = value.filter(
      (obj) => Object.values(obj)[0] === "Yes"
    );

    if (filteredObjects.length > 0) {
      const keys = filteredObjects.map((obj) =>
        Object.keys(obj)[0].toLowerCase()
      );

      const keysLength = keys.length;

      if (keysLength === 1) {
        result = keys[0];
      } else if (keysLength === 2) {
        result = `${keys[0]} and ${keys[1]}`;
      } else {
        result = `${keys.slice(0, -1).join(", ")}, and ${keys[keysLength - 1]}`;
      }
    }

    return result;
  };

  const formatTroubleFollowingNo = (value) => {
    let result = "";
    const filteredObjects = value.filter(
      (obj) => Object.values(obj)[0] === "No"
    );

    if (filteredObjects.length > 0) {
      const keys = filteredObjects.map((obj) =>
        Object.keys(obj)[0].toLowerCase()
      );

      const keysLength = keys.length;

      if (keysLength === 1) {
        result = keys[0];
      } else if (keysLength === 2) {
        result = `${keys[0]} and ${keys[1]}`;
      } else {
        result = `${keys.slice(0, -1).join(", ")}, and ${keys[keysLength - 1]}`;
      }
    }

    return result;
  };

  const formatDailyLivingFollowing = (value) => {
    let resultIndepently = "";
    let resultNeedHelp = "";
    let resultDon = "";
    let resultCan = "";
    let resultNA = "";

    const filterObjectIndepently = value.filter(
      (obj) => Object.values(obj)[0] === "Able to Do Independently"
    );

    if (filterObjectIndepently.length > 0) {
      const keyIndepently = filterObjectIndepently.map((obj) =>
        Object.keys(obj)[0].toLowerCase()
      );
      const indepentlyLength = keyIndepently.length;

      if (indepentlyLength === 1) {
        resultIndepently = keyIndepently[0];
      } else if (indepentlyLength === 2) {
        resultIndepently = `${keyIndepently[0]} and ${keyIndepently[1]}`;
      } else {
        resultIndepently = `${keyIndepently.slice(0, -1).join(", ")}, and ${
          keyIndepently[indepentlyLength - 1]
        }`;
      }
    }

    const filterObjectNeedHelp = value.filter(
      (obj) => Object.values(obj)[0] === "Need Help"
    );

    if (filterObjectNeedHelp.length > 0) {
      const keyNeedHelp = filterObjectNeedHelp.map((obj) =>
        Object.keys(obj)[0].toLowerCase()
      );

      const needHelpLength = keyNeedHelp.length;

      if (needHelpLength === 1) {
        resultNeedHelp = keyNeedHelp[0];
      } else if (needHelpLength === 2) {
        resultNeedHelp = `${keyNeedHelp[0]} and ${keyNeedHelp[1]}`;
      } else {
        resultNeedHelp = `${keyNeedHelp.slice(0, -1).join(", ")}, and ${
          keyNeedHelp[needHelpLength - 1]
        }`;
      }
    }

    const filterObjectDon = value.filter(
      (obj) => Object.values(obj)[0] === "Don't Do"
    );

    if (filterObjectDon.length > 0) {
      const keyDon = filterObjectDon.map((obj) =>
        Object.keys(obj)[0].toLowerCase()
      );

      const DonLength = keyDon.length;

      if (DonLength === 1) {
        resultDon = keyDon[0];
      } else if (DonLength === 2) {
        resultDon = `${keyDon[0]} and ${keyDon[1]}`;
      } else {
        resultDon = `${keyDon.slice(0, -1).join(", ")}, and ${
          keyDon[DonLength - 1]
        }`;
      }
    }

    const filterObjectCan = value.filter(
      (obj) => Object.values(obj)[0] === "Can't Do"
    );

    if (filterObjectCan.length > 0) {
      const keyCan = filterObjectCan.map((obj) =>
        Object.keys(obj)[0].toLowerCase()
      );

      const CanLength = keyCan.length;

      if (CanLength === 1) {
        resultCan = keyCan[0];
      } else if (CanLength === 2) {
        resultCan = `${keyCan[0]} and ${keyCan[1]}`;
      } else {
        resultCan = `${keyCan.slice(0, -1).join(", ")}, and ${
          keyCan[CanLength - 1]
        }`;
      }
    }

    const filterObjectNA = value.filter(
      (obj) => Object.values(obj)[0] === "N/A"
    );

    if (filterObjectNA.length > 0) {
      const keyNA = filterObjectNA.map((obj) =>
        Object.keys(obj)[0].toLowerCase()
      );

      const NALength = keyNA.length;

      if (NALength === 1) {
        resultNA = keyNA[0];
      } else if (NALength === 2) {
        resultNA = `${keyNA[0]} and ${keyNA[1]}`;
      } else {
        resultNA = `${keyNA.slice(0, -1).join(", ")}, and ${
          keyNA[NALength - 1]
        }`;
      }
    }

    return { resultIndepently, resultNeedHelp, resultDon, resultCan, resultNA };
  };

  const formatDifficultAmount = (value) => {
    let resultNoDifficult = "";
    let resultSomeDifficult = "";
    let resultMuchDifficult = "";
    let resultUnableDo = "";

    const filteredNoDifficult = value.filter(
      (obj) => Object.values(obj)[0] === "No Difficulty"
    );

    if (filteredNoDifficult.length > 0) {
      const keysNoDifficult = filteredNoDifficult.map((obj) =>
        Object.keys(obj)[0].toLowerCase()
      );

      const keysNoDifficultLength = keysNoDifficult.length;

      if (keysNoDifficultLength === 1) {
        resultNoDifficult = keysNoDifficult[0] + ". ";
      } else if (keysNoDifficultLength === 2) {
        resultNoDifficult = `${keysNoDifficult[0]} and ${keysNoDifficult[1]}. `;
      } else {
        resultNoDifficult = `${keysNoDifficult.slice(0, -1).join(", ")}, and ${
          keysNoDifficult[keysNoDifficultLength - 1]
        }. `;
      }
    }

    const filteredSomeDifficult = value.filter(
      (obj) => Object.values(obj)[0] === "Some Difficulty"
    );

    if (filteredSomeDifficult.length > 0) {
      const keysSomeDifficult = filteredSomeDifficult.map((obj) =>
        Object.keys(obj)[0].toLowerCase()
      );

      const keysSomeDifficultLength = keysSomeDifficult.length;

      if (keysSomeDifficultLength === 1) {
        resultSomeDifficult = keysSomeDifficult[0] + ". ";
      } else if (keysSomeDifficultLength === 2) {
        resultSomeDifficult = `${keysSomeDifficult[0]} and ${keysSomeDifficult[1]}. `;
      } else {
        resultSomeDifficult = `${keysSomeDifficult
          .slice(0, -1)
          .join(", ")}, and ${
          keysSomeDifficult[keysSomeDifficultLength - 1]
        }. `;
      }
    }

    const filteredMuchDifficult = value.filter(
      (obj) => Object.values(obj)[0] === "Much Difficulty"
    );

    if (filteredMuchDifficult.length > 0) {
      const keysMuchDifficult = filteredMuchDifficult.map((obj) =>
        Object.keys(obj)[0].toLowerCase()
      );

      const keysMuchDifficultLength = keysMuchDifficult.length;

      if (keysMuchDifficultLength === 1) {
        resultMuchDifficult = keysMuchDifficult[0] + ". ";
      } else if (keysMuchDifficultLength === 2) {
        resultMuchDifficult = `${keysMuchDifficult[0]} and ${keysMuchDifficult[1]}. `;
      } else {
        resultMuchDifficult = `${keysMuchDifficult
          .slice(0, -1)
          .join(", ")}, and ${
          keysMuchDifficult[keysMuchDifficultLength - 1]
        }. `;
      }
    }

    const filteredUnableDo = value.filter(
      (obj) => Object.values(obj)[0] === "Unable to Do"
    );

    if (filteredUnableDo.length > 0) {
      const keysUnableDo = filteredUnableDo.map((obj) =>
        Object.keys(obj)[0].toLowerCase()
      );

      const keysUnableDoLength = keysUnableDo.length;

      if (keysUnableDoLength === 1) {
        resultUnableDo = keysUnableDo[0] + ". ";
      } else if (keysUnableDoLength === 2) {
        resultUnableDo = `${keysUnableDo[0]} and ${keysUnableDo[1]}. `;
      } else {
        resultUnableDo = `${keysUnableDo.slice(0, -1).join(", ")}, and ${
          keysUnableDo[keysUnableDoLength - 1]
        }. `;
      }
    }

    return {
      resultNoDifficult,
      resultSomeDifficult,
      resultMuchDifficult,
      resultUnableDo,
    };
  };

  const formatEmployerList = (value, lastName) => {
    console.log(value);

    let outPut = value.map((item, index) => {
      if (item.reasonForLeaving) {
        return `Mr. ${lastName} worked for ${item.employer} as a ${item.jobTitle} ${item.datesOfEmployment} and left this job due to ${item.reasonForLeaving}`;
      } else {
        return `Mr. ${lastName} worked for ${item.employer} as a ${item.jobTitle} ${item.datesOfEmployment}`;
      }
    });

    return outPut.join(", ");
  };

  const storyParagraphs = (value) => {
    console.log(value);
    const sentences = value.split(", ");
    const paragraphs = sentences.map((sentence) => {
      const capitalizedValue =
        sentence.charAt(0).toUpperCase() + sentence.slice(1);

      return new Paragraph({
        children: [
          new TextRun({
            text: capitalizedValue,
            font: "Times New Roman",
            size: 24,
          }),
        ],
      });
    });

    console.log(sentences);

    return paragraphs;
  };

  const doc = new Document({
    sections: [
      {
        children: [
          TitleParagraph("Demographic Information, Part I"),
          questionParagraph("1. What is your First Name?"),
          answerParagraph(`${req.body?.demographicInformation?.firstName}`),
          questionParagraph("2. What is your Last Name?"),
          answerParagraph(`${req.body?.demographicInformation?.lastName}`),
          questionParagraph("3. What is your date of birth?"),
          answerParagraph(`${req.body?.demographicInformation?.birth}`),
          questionParagraph(
            "4. Please select any of the following that represent your race or ethnicity. You may select more than one."
          ),
          answerParagraph(
            `${req.body?.demographicInformation?.checkedEthnicityItems}`
          ),
          questionParagraph("5. What sex was assigned to you at birth?"),
          answerParagraph(`${req.body?.demographicInformation?.radioSexItem}`),
          req.body?.demographicInformation?.radioSexItem === "Female"
            ? questionParagraph(
                "Are you pregnant, planning on getting pregnant, or breastfeeding?"
              )
            : undefined,
          req.body?.demographicInformation?.radioSexItem === "Female"
            ? answerParagraph(`${req.body?.demographicInformation?.pregnant}`)
            : undefined,
          questionParagraph("6. What pronoun do you currently prefer?"),
          answerParagraph(
            `${req.body?.demographicInformation?.radioPreferPronounItem}`
          ),
          questionParagraph("7. What is your marital status?"),
          answerParagraph(
            `${req.body?.demographicInformation?.maritalStatusItems}`
          ),
          questionParagraph("8. What is your email?"),
          answerParagraph(`${req.body?.demographicInformation?.email}`),
          questionParagraph("9. What is your phone number?"),
          answerParagraph(`${req.body?.demographicInformation?.phoneNumber}`),

          TitleParagraph(
            "Employment Where the Physical or Emotional Injury Occurred"
          ),
          questionParagraph("10. Name of your current employer:"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.currentEmployerName}`
          ),
          questionParagraph("11. What is the nature of this business:"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.businessNature}`
          ),
          questionParagraph("12. Date this job began:"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.jobBeganDate}`
          ),
          questionParagraph(
            "13. What was the last day you worked at this job?"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.jobLastDate}`
          ),
          questionParagraph(
            "14. Your job title when you started this employment:"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.startedJobTitle}`
          ),
          questionParagraph(
            "15. Your current title or title when you ended this employment:"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.currentTitle}`
          ),
          questionParagraph("16. Your employment duties:"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.employmentDuty}`
          ),
          questionParagraph(
            "17. Your typical work schedule (hours worked per day, week, or month):"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.typicalWorkSchedule}`
          ),
          questionParagraph("18. Your salary:"),
          answerParagraph(`${req.body?.employmentInjuryPhysicalValue?.salary}`),
          questionParagraph("Hourly Rate:"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.hourlyRate}`
          ),
          questionParagraph("Do you receive overtime pay?"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.receiveOvertimePay}`
          ),
          req.body?.employmentInjuryPhysicalValue?.receiveOvertimePay === "Yes"
            ? questionParagraph(
                "How much overtime pay do you typically receive?"
              )
            : undefined,
          req.body?.employmentInjuryPhysicalValue?.receiveOvertimePay === "Yes"
            ? answerParagraph(
                `${req.body?.employmentInjuryPhysicalValue?.overtimeRate}`
              )
            : undefined,
          questionParagraph("19. What do you like about this job?"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.likeJob}`
          ),
          questionParagraph("20. What do you not like about this job?"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.notLikeJob}`
          ),
          questionParagraph(
            "21. BEFORE the injury, were you being treated for any physical or medical condition(s)?"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.radioPhysicalConditionBeforeInjuryItem}`
          ),
          questionParagraph(
            "22. BEFORE the injury, were you being treated for any mental or emotional condition(s)?"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.radioMentalConditionBeforeInjuryItem}`
          ),
          questionParagraph(
            "23. BEFORE the injury, were you experiencing any emotional symptoms?"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.radioEmotionalSymptomsBeforeInjuryItem}`
          ),
          questionParagraph(
            "24. Describe these medical or emotional conditions or symptoms BEFORE the injury:"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.describeMedicalCondition}`
          ),
          questionParagraph(
            "25. Were you taking any medications BEFORE the injury?"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.radioMedicationsBeforeInjuryItem}`
          ),
          questionParagraph(
            "26. What medications were you taking BEFORE the injury?"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.radioMedicationsNameBeforeInjuryItem}`
          ),
          questionParagraph(
            "27. Date of your injury (if more than one, list each):"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.injuryDate}`
          ),
          questionParagraph(
            "28. Describe the injury that occurred (provide as many details as you can):"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.describeInjuryOccurred}`
          ),
          questionParagraph(
            "29. Do you currently receive disability in connection with your claim?"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.radioDisabilityConnectionClaimItem}`
          ),
          req.body?.employmentInjuryPhysicalValue
            ?.radioDisabilityConnectionClaimItem === "Yes"
            ? questionParagraph("If Yes, Which Current Disability:")
            : undefined,
          req.body?.employmentInjuryPhysicalValue
            ?.radioDisabilityConnectionClaimItem === "Yes"
            ? answerParagraph(
                `${req.body?.employmentInjuryPhysicalValue?.currentDisability}`
              )
            : undefined,
          questionParagraph(
            "30. Would you have continued working if not injured?"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.radioContinuedWorkingItem}`
          ),
          questionParagraph("31. Are you currently working"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.radioCurrentlyWorkingItem}`
          ),

          questionParagraph(
            "32. Have you had any conflicts with anyone at Work"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.radioConflictsItem}`
          ),

          req.body?.employmentInjuryPhysicalValue?.radioConflictsItem === "Yes"
            ? questionParagraph(
                "How many separate conflicts have you had with others at work"
              )
            : undefined,
          req.body?.employmentInjuryPhysicalValue?.radioConflictsItem === "Yes"
            ? answerParagraph(
                `${req.body?.employmentInjuryPhysicalValue?.conflictsCount}`
              )
            : undefined,
          req.body?.employmentInjuryPhysicalValue?.radioConflictsItem === "Yes"
            ? questionParagraph(
                "Please list separately and explain each conflict that occurred:"
              )
            : undefined,
          req.body?.employmentInjuryPhysicalValue?.radioConflictsItem === "Yes"
            ? answerParagraph(
                `${req.body?.employmentInjuryPhysicalValue?.eachConflicts}`
              )
            : undefined,
          req.body?.employmentInjuryPhysicalValue?.radioConflictsItem === "Yes"
            ? questionParagraph(
                "Please rate the percentage that each of these conflicts caused you to feel upset, out of total of 100% (Example: Conflict #1 30%, #2 50%, #3 20%)"
              )
            : undefined,
          req.body?.employmentInjuryPhysicalValue?.radioConflictsItem === "Yes"
            ? answerParagraph(
                `${req.body?.employmentInjuryPhysicalValue?.conflictsRate}`
              )
            : undefined,

          questionParagraph(
            "33. What was/is your working relationship like with management or supervisors in general?"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.relationShipLikeManagement}`
          ),
          questionParagraph("34. Name of your immediate supervisor:"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.immediateSupervisorName}`
          ),
          questionParagraph("35. Relationship with immediate supervisor?"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.relationshipImmediateSupervisor}`
          ),
          req.body?.employmentInjuryPhysicalValue
            ?.relationshipImmediateSupervisor === "poor"
            ? questionParagraph("Explain the reason:")
            : undefined,
          req.body?.employmentInjuryPhysicalValue
            ?.relationshipImmediateSupervisor === "poor"
            ? answerParagraph(
                `${req.body?.employmentInjuryPhysicalValue?.explainSuperVisorReason}`
              )
            : undefined,
          questionParagraph("36. How were your performance appraisals?"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.performanceAppraisals}`
          ),
          req.body?.employmentInjuryPhysicalValue?.performanceAppraisals ===
          "poor"
            ? questionParagraph("Explain reason")
            : undefined,
          req.body?.employmentInjuryPhysicalValue?.performanceAppraisals ===
          "poor"
            ? answerParagraph(
                `${req.body?.employmentInjuryPhysicalValue?.explainPerformanceAppraisals}`
              )
            : undefined,
          questionParagraph(
            "37. Have you ever received verbal or written warnings?"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.verbalWarning}`
          ),
          req.body?.employmentInjuryPhysicalValue?.verbalWarning === "Yes"
            ? questionParagraph("Describe dates and reason given:")
            : undefined,
          req.body?.employmentInjuryPhysicalValue?.verbalWarning === "Yes"
            ? answerParagraph(
                `${req.body?.employmentInjuryPhysicalValue?.verbalWarningDateReason}`
              )
            : undefined,
          questionParagraph("38. Working relationship with co-workers?"),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.relationshipCoWorkers}`
          ),
          req.body?.employmentInjuryPhysicalValue?.relationshipCoWorkers ===
          "poor"
            ? questionParagraph(
                "Please give the names and reasons this relationship was poor."
              )
            : undefined,
          req.body?.employmentInjuryPhysicalValue?.relationshipCoWorkers ===
          "poor"
            ? answerParagraph(
                `${req.body?.employmentInjuryPhysicalValue?.explainRelationshipCoWorkers}`
              )
            : undefined,
          questionParagraph(
            "39. Was there a 'last straw' event near the last day of work?"
          ),
          answerParagraph(
            `${req.body?.employmentInjuryPhysicalValue?.lastStraw}`
          ),
          req.body?.employmentInjuryPhysicalValue?.lastStraw === "Yes"
            ? questionParagraph(
                "Please describe your 'last straw' event near the last day of your work"
              )
            : undefined,
          req.body?.employmentInjuryPhysicalValue?.lastStraw === "Yes"
            ? answerParagraph(
                `${req.body?.employmentInjuryPhysicalValue?.explainLastStraw}`
              )
            : undefined,

          TitleParagraph("Current Employer (If Different Than Above)"),
          questionParagraph(
            "40. Do you currently work for the same employer where the above injury occurred?"
          ),
          answerParagraph(
            `${req.body?.currentEmployerValue?.currentlyWorkEmployerInjury}`
          ),
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Name of current employer:")
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body?.currentEmployerValue?.currentlyWorkEmployerName}`
              )
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Nature of business:")
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body?.currentEmployerValue?.currentlyWorkNatureBusiness}`
              )
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Job title:")
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body?.currentEmployerValue?.currentlyWorkJobTitle}`
              )
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Job duties:")
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body?.currentEmployerValue?.currentlyWorkJobDuties}`
              )
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Date this job began:")
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body?.currentEmployerValue?.currentlyWorkJobBeganDate}`
              )
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? questionParagraph(
                "Your schedule, hours worked per (day, week, month):"
              )
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body?.currentEmployerValue?.currentlyWorkSchedule}`
              )
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Salary or hourly rate:")
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body?.currentEmployerValue?.currentlyWorkSalary}`
              )
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? questionParagraph("Do you like this job?")
            : undefined,
          req.body?.currentEmployerValue?.currentlyWorkEmployerInjury === "No"
            ? answerParagraph(
                `${req.body?.currentEmployerValue?.currentlyWorkLikeThisJob}`
              )
            : undefined,

          TitleParagraph("Physical Injury"),
          questionParagraph(
            "41. If your injury was initially physical, describe the first symptoms (pain) you experienced:"
          ),
          answerParagraph(`${req.body?.physicalInjuryValue?.firstSymptoms}`),
          questionParagraph(
            "42. If your injury was initially physical, describe the first treatment you received following this injury (medical, chiropractic, physical therapy pt, injections):"
          ),
          answerParagraph(`${req.body?.physicalInjuryValue?.firstTreatment}`),
          questionParagraph(
            "43. If your injury was initially physical, describe the rest of your treatment (medical, chiropractic, pt)"
          ),
          answerParagraph(
            `${req.body?.physicalInjuryValue?.restYourTreatment}`
          ),
          questionParagraph(
            "44. List the doctors you have seen for this physical injury:"
          ),
          answerParagraph(`${req.body?.physicalInjuryValue?.doctorsList}`),
          questionParagraph("45. Did you receive surgery for this injury?"),
          answerParagraph(`${req.body?.physicalInjuryValue?.receivedSurgery}`),
          questionParagraph(
            "46. List the surgeries you have received for this physical injury:"
          ),
          answerParagraph(`${req.body?.physicalInjuryValue?.surgeryList}`),
          questionParagraph(
            "47. List the medications you have received for this physical injury:"
          ),
          answerParagraph(`${req.body?.physicalInjuryValue?.medicationList}`),
          questionParagraph(
            "48. Have any of the above treatments helped relieve your pain?"
          ),
          answerParagraph(`${req.body?.physicalInjuryValue?.treatmentsHelped}`),
          questionParagraph("49. Are you still working?"),
          answerParagraph(`${req.body?.physicalInjuryValue?.stillWorking}`),
          questionParagraph("50. If not working, reason for leaving?"),
          answerParagraph(`${req.body?.physicalInjuryValue?.leavingReason}`),

          TitleParagraph("Emotional Symptoms and Injuries"),
          questionParagraph(
            "51. I am most bothered on this day by the following:"
          ),
          answerParagraph(`${req.body?.chiefComplaintValue?.mostBothered}`),
          questionParagraph(
            "52. What emotional symptoms are you currently experiencing or recently experienced?"
          ),
          answerParagraph(
            `${req.body?.chiefComplaintValue?.currentlyExperiencingSymptom}`
          ),
          req.body?.chiefComplaintValue?.currentlyExperiencingSymptom !==
          "none of the above"
            ? questionParagraph(
                "When did this current episode of these emotional symptoms begin?"
              )
            : undefined,
          answerParagraph(
            `${req.body?.chiefComplaintValue?.currentEpisodeDate}`
          ),
          questionParagraph(
            "53. Have you experienced any of your above emotional symptoms in response to a specific stressful event in your life?"
          ),
          answerParagraph(
            `${req.body?.chiefComplaintValue?.specificStressfulSymptom}`
          ),
          req.body?.chiefComplaintValue?.specificStressfulSymptom === "Yes"
            ? questionParagraph(
                "What was the stressful event that triggered your emotional symptoms?"
              )
            : undefined,
          req.body?.chiefComplaintValue?.specificStressfulSymptom === "Yes"
            ? answerParagraph(
                `${req.body?.chiefComplaintValue?.specificStressfulEvent}`
              )
            : undefined,
          questionParagraph(
            "54. Do you have stress from any of the following?"
          ),
          answerParagraph(`${req.body?.chiefComplaintValue?.stressFollowing}`),

          TitleParagraph("Longitudinal History"),
          questionParagraph(
            "55. When did this episode of your depression, anxiety, or post-trauma emotions start?"
          ),
          answerParagraph(
            `${req.body?.longitudinalHistoryValue?.emotionEpisodeBegan}`
          ),
          questionParagraph(
            "56. Describe the emotional/psychiatric symptoms you have experienced"
          ),
          answerParagraph(
            `${req.body?.longitudinalHistoryValue?.emotionSymptom}`
          ),
          questionParagraph(
            "57. During this current or most recent symptom episode, when were your symptoms the worst?"
          ),
          answerParagraph(
            `${req.body?.longitudinalHistoryValue?.mostWorstSymptom}`
          ),
          questionParagraph(
            "58. Have your emotional symptoms become worse or better since they started or since a specific date or event?"
          ),
          answerParagraph(
            `${req.body?.longitudinalHistoryValue?.emotionalSymptomBecome}`
          ),
          questionParagraph(
            "59. On what date did your emotional symptoms become worse or better?"
          ),
          answerParagraph(
            `${req.body?.longitudinalHistoryValue?.emotionalSymptomDate}`
          ),
          questionParagraph("60. How often do you feel the above emotions?"),
          answerParagraph(`${req.body?.longitudinalHistoryValue?.feelEmotion}`),
          req.body?.longitudinalHistoryValue?.feelEmotion === "other"
            ? questionParagraph(
                "If other: Explain how often you feel the above emotions"
              )
            : undefined,
          req.body?.longitudinalHistoryValue?.feelEmotion === "other"
            ? answerParagraph(
                `${req.body?.longitudinalHistoryValue?.explainFeelEmotion}`
              )
            : undefined,
          questionParagraph(
            "61. How would you rate your depressive, anxiety, or post-trauma symptoms when they were most severe, with zero to 1 equaling no or minimal symptoms and 10 equaling the most severe symptoms imaginable?"
          ),
          answerParagraph(
            `Depressive: ${req.body?.longitudinalHistoryValue?.depressiveSymptom}`
          ),
          answerParagraph(
            `Anxiety: ${req.body?.longitudinalHistoryValue?.anxietySymptom}`
          ),
          answerParagraph(
            `PostTrauma: ${req.body?.longitudinalHistoryValue?.postTraumaSymptom}`
          ),
          questionParagraph(
            "62. Currently, how do you rate your depressive, anxiety, or post-trauma symptoms on the same 1-10 scale?"
          ),
          answerParagraph(
            `${req.body?.longitudinalHistoryValue?.compareEmotionalSymptom}`
          ),
          questionParagraph(
            "63. Have Your Emotional Symptoms Affected Your Ability to Do Your Job?"
          ),
          answerParagraph(
            `${req.body?.longitudinalHistoryValue?.symptomsAffectedJob}`
          ),
          req.body?.longitudinalHistoryValue?.symptomsAffectedJob === "Yes"
            ? questionParagraph(
                "Please describe how your emotional symptoms have affected your ability to do your job?"
              )
            : undefined,
          req.body?.longitudinalHistoryValue?.symptomsAffectedJob === "Yes"
            ? answerParagraph(
                `${req.body?.longitudinalHistoryValue?.describeSymptomsAffectedJob}`
              )
            : undefined,

          TitleParagraph("Current Symptoms"),
          TitleParagraph("PHQ-9"),
          questionParagraph("64. Little interest or pleasure in doing things?"),
          answerParagraph(`${req.body?.PHQValue?.interestThing}`),
          req.body?.PHQValue?.interestThing !== "" &&
          req.body?.PHQValue?.interestThing !== "not at all"
            ? questionParagraph(
                "If you have lost the ability to enjoy activities that were previously enjoyable, please list those activities that you used to but no longer enjoy."
              )
            : undefined,
          req.body?.PHQValue?.interestThing !== "" &&
          req.body?.PHQValue?.interestThing !== "not at all"
            ? answerParagraph(`${req.body?.PHQValue?.previouslyEnjoyable}`)
            : undefined,
          questionParagraph("65. Feeling down, depressed, or hopeless?"),
          answerParagraph(`${req.body?.PHQValue?.feelingDepressed}`),

          req.body?.PHQValue?.feelingDepressed !== "" &&
          req.body?.PHQValue?.feelingDepressed !== "not at all"
            ? questionParagraph(
                "Have your depressive symptoms improved or become worse since they started?"
              )
            : undefined,
          req.body?.PHQValue?.feelingDepressed !== "" &&
          req.body?.PHQValue?.feelingDepressed !== "not at all"
            ? answerParagraph(
                `${req.body?.PHQValue?.depressiveSymptomsImproved}`
              )
            : undefined,
          req.body?.PHQValue?.feelingDepressed !== "" &&
          req.body?.PHQValue?.feelingDepressed !== "not at all"
            ? questionParagraph(
                "How often do you feel depressed during this or your most recent episode?"
              )
            : undefined,
          req.body?.PHQValue?.feelingDepressed !== "" &&
          req.body?.PHQValue?.feelingDepressed !== "not at all"
            ? answerParagraph(`${req.body?.PHQValue?.oftenFeelDepressed}`)
            : undefined,
          req.body?.PHQValue?.feelingDepressed !== "" &&
          req.body?.PHQValue?.feelingDepressed !== "not at all"
            ? questionParagraph(
                "When you experience depression, does it last a majority of the day for most days of the week?"
              )
            : undefined,
          req.body?.PHQValue?.feelingDepressed !== "" &&
          req.body?.PHQValue?.feelingDepressed !== "not at all"
            ? answerParagraph(`${req.body?.PHQValue?.experienceDepression}`)
            : undefined,

          questionParagraph(
            "66. Over the last 2 weeks, have you had trouble falling or staying asleep, or sleeping too much?"
          ),
          answerParagraph(`${req.body?.PHQValue?.troubleFallingAsleep}`),
          req.body?.PHQValue?.troubleFallingAsleep !== "" &&
          req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
            ? questionParagraph(
                "How many times do you wake up per night before the time you plan to wake up?"
              )
            : undefined,
          req.body?.PHQValue?.troubleFallingAsleep !== "" &&
          req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
            ? answerParagraph(`${req.body?.PHQValue?.wakeUpTimes}`)
            : undefined,
          req.body?.PHQValue?.troubleFallingAsleep !== "" &&
          req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
            ? questionParagraph(
                "If trouble staying asleep, when you wake up during the night, how long do you stay awake for?"
              )
            : undefined,
          req.body?.PHQValue?.troubleFallingAsleep !== "" &&
          req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
            ? answerParagraph(`${req.body?.PHQValue?.stayAwakeLong}`)
            : undefined,
          req.body?.PHQValue?.troubleFallingAsleep !== "" &&
          req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
            ? questionParagraph(
                "Do any of the following awaken you from sleep?"
              )
            : undefined,
          req.body?.PHQValue?.troubleFallingAsleep !== "" &&
          req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
            ? answerParagraph(`${req.body?.PHQValue?.awakeSleepReason}`)
            : undefined,
          req.body?.PHQValue?.troubleFallingAsleep !== "" &&
          req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
            ? questionParagraph(
                "What is the total number of hours you sleep per 24 hours?"
              )
            : undefined,
          req.body?.PHQValue?.troubleFallingAsleep !== "" &&
          req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
            ? answerParagraph(`${req.body?.PHQValue?.totalSleepTimes}`)
            : undefined,

          questionParagraph(
            "67. Over the last 2 weeks, have you been feeling tired or having little energy?"
          ),
          answerParagraph(`${req.body?.PHQValue?.feelingEnergy}`),
          questionParagraph(
            "68. Over the last 2 weeks, have you had poor appetite or been overeating?"
          ),
          answerParagraph(`${req.body?.PHQValue?.poorAppetite}`),
          req.body?.PHQValue?.poorAppetite !== "" &&
          req.body?.PHQValue?.poorAppetite !== "not at all"
            ? questionParagraph(
                "If you have gained or lost weight recently, how many pounds have you gained or lost?"
              )
            : undefined,
          req.body?.PHQValue?.poorAppetite !== "" &&
          req.body?.PHQValue?.poorAppetite !== "not at all"
            ? answerParagraph(`${req.body?.PHQValue?.recentlyWeightPounds}`)
            : undefined,
          req.body?.PHQValue?.poorAppetite !== "" &&
          req.body?.PHQValue?.poorAppetite !== "not at all"
            ? questionParagraph(
                "How long did it take you to gain or lose this weight?"
              )
            : undefined,
          req.body?.PHQValue?.poorAppetite !== "" &&
          req.body?.PHQValue?.poorAppetite !== "not at all"
            ? answerParagraph(`${req.body?.PHQValue?.weightGainLostLong}`)
            : undefined,

          questionParagraph(
            "69. Over the last 2 weeks, have you been feeling bad about yourself — or that you are a failure or have let yourself or your family down?"
          ),
          answerParagraph(`${req.body?.PHQValue?.yourselfFeelingBad}`),
          questionParagraph(
            "70. Over the last 2 weeks, have you had trouble concentrating on things, such as reading the newspaper or watching television?"
          ),
          answerParagraph(`${req.body?.PHQValue?.troubleConCentratingThing}`),
          questionParagraph(
            "71. Over the last 2 weeks, have you been moving or speaking so slowly that other people could have noticed? Or so fidgety or restless that you have been moving a lot more than usual?"
          ),
          answerParagraph(`${req.body?.PHQValue?.fidgetyMoving}`),
          questionParagraph(
            "72. Over the last 2 weeks, have you had thoughts that you would be better off dead, or thoughts of hurting yourself in some way?"
          ),
          answerParagraph(`${req.body?.PHQValue?.betterOffDeadYourself}`),
          questionParagraph(
            "73. In the past month, have you wished you were dead or wished you could go to sleep and not wake up?"
          ),
          answerParagraph(`${req.body?.PHQValue?.deadWishWakeUp}`),
          questionParagraph(
            "74. In the past month, have you had any actual thoughts of killing yourself?"
          ),
          answerParagraph(`${req.body?.PHQValue?.killingYourself}`),
          req.body?.PHQValue?.killingYourself !== "" &&
          req.body?.PHQValue?.killingYourself !== "No"
            ? questionParagraph(
                "Have you been thinking about how you might kill yourself?"
              )
            : undefined,
          req.body?.PHQValue?.killingYourself !== "" &&
          req.body?.PHQValue?.killingYourself !== "No"
            ? answerParagraph(`${req.body?.PHQValue?.killMethod}`)
            : undefined,
          req.body?.PHQValue?.killingYourself !== "No" &&
          req.body?.PHQValue?.killMethod !== "No"
            ? questionParagraph(
                "Have you had these thoughts, and had some intention of acting on them?"
              )
            : undefined,
          req.body?.PHQValue?.killingYourself !== "No" &&
          req.body?.PHQValue?.killMethod !== "No"
            ? answerParagraph(`${req.body?.PHQValue?.actingIntention}`)
            : undefined,
          req.body?.PHQValue?.killingYourself !== "No" &&
          req.body?.PHQValue?.killMethod !== "No" &&
          req.body?.PHQValue?.actingIntention !== "No"
            ? questionParagraph(
                "Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan?"
              )
            : undefined,
          req.body?.PHQValue?.killingYourself !== "No" &&
          req.body?.PHQValue?.killMethod !== "No" &&
          req.body?.PHQValue?.actingIntention !== "No"
            ? answerParagraph(`${req.body?.PHQValue?.killIntentionCarryout}`)
            : undefined,

          questionParagraph(
            "75. Have you ever done anything, started to do anything, or prepared to do anything to end your life?"
          ),
          answerParagraph(`${req.body?.PHQValue?.preparedAnythingEndYourlife}`),
          questionParagraph("76. Do you have thoughts of hurting anyone else?"),
          answerParagraph(`${req.body?.PHQValue?.hurtingAnyone}`),
          questionParagraph(
            "77. With zero to 1 equaling no or minimal symptoms and 10 equaling the most severe symptoms possible, how do you rate your current depressive symptoms?"
          ),
          answerParagraph(`${req.body?.PHQValue?.currentDepressiveSymptoms}`),

          TitleParagraph("GAD-7"),
          questionParagraph(
            "78. Over the last 2 weeks, how often have you been feeling nervous, anxious, or on edge"
          ),
          answerParagraph(`${req.body?.GADValue?.feelingNervous}`),
          req.body?.GADValue?.feelingNervous !== "" &&
          req.body?.GADValue?.feelingNervous !== "not at all"
            ? questionParagraph(
                "How long have you felt anxious during this or your most recent episode?"
              )
            : undefined,
          req.body?.GADValue?.feelingNervous !== "" &&
          req.body?.GADValue?.feelingNervous !== "not at all"
            ? answerParagraph(`${req.body?.GADValue?.feltAnxiousLong}`)
            : undefined,
          req.body?.GADValue?.feelingNervous !== "" &&
          req.body?.GADValue?.feelingNervous !== "not at all"
            ? questionParagraph("How often do you feel anxious?")
            : undefined,
          req.body?.GADValue?.feelingNervous !== "" &&
          req.body?.GADValue?.feelingNervous !== "not at all"
            ? answerParagraph(`${req.body?.GADValue?.feelAnxiousOften}`)
            : undefined,
          questionParagraph(
            "79. Over the last 2 weeks, how often have you been not being able to stop or control worrying"
          ),
          answerParagraph(`${req.body?.GADValue?.stopControlWorring}`),
          questionParagraph(
            "80. Over the last 2 weeks, how often have you been worrying too much about different things"
          ),
          answerParagraph(`${req.body?.GADValue?.worringDifferentThing}`),
          req.body?.GADValue?.worringDifferentThing !== "" &&
          req.body?.GADValue?.worringDifferentThing !== "not at all"
            ? questionParagraph("What do you worry about?")
            : undefined,
          req.body?.GADValue?.worringDifferentThing !== "" &&
          req.body?.GADValue?.worringDifferentThing !== "not at all"
            ? answerParagraph(`${req.body?.GADValue?.worringThing}`)
            : undefined,
          req.body?.GADValue?.worringDifferentThing !== "" &&
          req.body?.GADValue?.worringDifferentThing !== "not at all" &&
          req.body?.GADValue?.worringThing === "other"
            ? questionParagraph(
                "You selected 'other'. Please describe what you worry about."
              )
            : undefined,
          req.body?.GADValue?.worringDifferentThing !== "" &&
          req.body?.GADValue?.worringDifferentThing !== "not at all" &&
          req.body?.GADValue?.worringThing === "other"
            ? answerParagraph(`${req.body?.GADValue?.describeWorringThing}`)
            : undefined,
          req.body?.GADValue?.worringDifferentThing !== "" &&
          req.body?.GADValue?.worringDifferentThing !== "not at all"
            ? questionParagraph(
                "Does anything specific make your anxiety worse?"
              )
            : undefined,
          req.body?.GADValue?.worringDifferentThing !== "" &&
          req.body?.GADValue?.worringDifferentThing !== "not at all"
            ? answerParagraph(`${req.body?.GADValue?.specificAnxietyWorse}`)
            : undefined,

          questionParagraph(
            "81. Over the last 2 weeks, how often have you been trouble relaxing"
          ),
          answerParagraph(`${req.body?.GADValue?.troubleRelaxing}`),
          questionParagraph(
            "82. Over the last 2 weeks, how often have you been being so restless that it's hard to sit still"
          ),
          answerParagraph(`${req.body?.GADValue?.restlessSitHard}`),
          questionParagraph(
            "83. Over the last 2 weeks, how often have you been becoming easily annoyed or irritable"
          ),
          answerParagraph(`${req.body?.GADValue?.easilyAnnoyed}`),
          questionParagraph(
            "84. Over the last 2 weeks, how often have you been feeling afraid as if something awful might happen"
          ),
          answerParagraph(`${req.body?.GADValue?.feelingAfraidAwfulThing}`),
          questionParagraph(
            "85. Over the last 2 weeks, how often have you been with zero to 1 equaling no or minimal symptoms and 10 equaling the most severe symptoms possible, how do you rate your current anxiety symptoms?"
          ),
          answerParagraph(`${req.body?.GADValue?.currentAnxietySymptoms}`),
          questionParagraph(
            "86. Over the last 2 weeks, how often have you been experience panic attacks, in which your heart races, you feel like you can't breathe, you shake or sweat?"
          ),
          answerParagraph(`${req.body?.GADValue?.panicAttacks}`),
          req.body?.GADValue?.panicAttacks === "Yes"
            ? questionParagraph(
                "If you experience panic attacks, indicate the physical symptoms that occur."
              )
            : undefined,

          req.body?.GADValue?.panicAttacks === "Yes"
            ? answerParagraph(`${req.body?.GADValue?.panicPhysicalSymptoms}`)
            : undefined,

          req.body?.GADValue?.panicAttacks === "Yes"
            ? questionParagraph(
                "If you experience panic attacks, how often do they occur?"
              )
            : undefined,
          req.body?.GADValue?.panicAttacks === "Yes"
            ? answerParagraph(`${req.body?.GADValue?.panicOccur}`)
            : undefined,

          req.body?.GADValue?.panicAttacks === "Yes"
            ? questionParagraph(
                "If you experience panic attacks, how long do they last?"
              )
            : undefined,

          req.body?.GADValue?.panicAttacks === "Yes"
            ? answerParagraph(`${req.body?.GADValue?.panicAttacksLastLong}`)
            : undefined,
          req.body?.GADValue?.panicAttacks === "Yes" &&
          req.body?.GADValue?.panicAttacksList !== ""
            ? questionParagraph(
                "Please list anything that triggers your panic attacks:"
              )
            : undefined,
          req.body?.GADValue?.panicAttacks === "Yes" &&
          req.body?.GADValue?.panicAttacksList !== ""
            ? answerParagraph(`${req.body?.GADValue?.panicAttacksList}`)
            : undefined,

          req.body?.GADValue?.panicAttacks === "Yes"
            ? questionParagraph(
                "Are your panic attacks spontaneous and unrelated to any events?"
              )
            : undefined,
          req.body?.GADValue?.panicAttacks === "Yes"
            ? answerParagraph(`${req.body?.GADValue?.panicAttacksSpontaneous}`)
            : undefined,

          questionParagraph("87. Have you experienced past traumatic event(s)"),
          answerParagraph(`${req.body?.GADValue?.pastTraumaticEvents}`),
          req.body?.GADValue?.pastTraumaticEvents == "Yes"
            ? questionParagraph("What traumatic event(s) did you experience?")
            : undefined,
          req.body?.GADValue?.pastTraumaticEvents == "Yes"
            ? answerParagraph(`${req.body?.GADValue?.traumaticEventExperience}`)
            : undefined,
          req.body?.GADValue?.pastTraumaticEvents == "Yes"
            ? questionParagraph(
                "If you feel comfortable, please describe your traumatic experiences:"
              )
            : undefined,
          req.body?.GADValue?.pastTraumaticEvents == "Yes"
            ? answerParagraph(
                `${req.body?.GADValue?.describeTraumaticExperience}`
              )
            : undefined,

          TitleParagraph("PCL-5"),
          questionParagraph(
            "88. Repeated, disturbing, and unwanted memories of the stressful experience?"
          ),
          answerParagraph(`${req.body?.PCLValue?.stressfulExperienceMemories}`),
          questionParagraph(
            "89. Repeated, disturbing dreams of the stressful experience?"
          ),
          answerParagraph(`${req.body?.PCLValue?.stressfulExperience}`),
          req.body?.PCLValue?.stressfulExperience !== "" &&
          req.body?.PCLValue?.stressfulExperience !== "not at all"
            ? questionParagraph("These disturbing dreams occur")
            : undefined,
          req.body?.PCLValue?.stressfulExperience !== "" &&
          req.body?.PCLValue?.stressfulExperience !== "not at all"
            ? answerParagraph(`${req.body?.PCLValue?.disturbingDreamsOccur}`)
            : undefined,
          questionParagraph(
            "90. Suddenly feeling or acting as if the stressful experience were actually happening again (as if you were actually back there reliving it)?"
          ),
          answerParagraph(`${req.body?.PCLValue?.suddenlyStressfulExperience}`),
          questionParagraph(
            "91. Feeling very upset when something reminded you of the stressful experience?"
          ),
          answerParagraph(
            `${req.body?.PCLValue?.veryUpsetStressfulExperience}`
          ),
          questionParagraph(
            "92. Having strong physical reactions when something reminded you of the stressful experience (for example, heart pounding, trouble breathing, sweating)?"
          ),
          answerParagraph(
            `${req.body?.PCLValue?.strongPhysicalReactionStressfulExperience}`
          ),
          questionParagraph(
            "93. Avoiding memories, thoughts, or feelings related to the stressful experience?"
          ),
          answerParagraph(`${req.body?.PCLValue?.avoidingMemories}`),
          questionParagraph(
            "94. Avoiding external reminders of the stressful experience (for example, people, places, conversations, activities, objects, or situations)?"
          ),
          answerParagraph(`${req.body?.PCLValue?.avoidingExternalReminders}`),
          req.body?.PCLValue?.avoidingExternalReminders !== "" &&
          req.body?.PCLValue?.avoidingExternalReminders !== "not at all"
            ? questionParagraph(
                "Please describe the people, places, conversations, objects, or situations you avoid:"
              )
            : undefined,
          req.body?.PCLValue?.avoidingExternalReminders !== "" &&
          req.body?.PCLValue?.avoidingExternalReminders !== "not at all"
            ? answerParagraph(`${req.body?.PCLValue?.describeSituations}`)
            : undefined,
          req.body?.PCLValue?.avoidingExternalReminders !== "" &&
          req.body?.PCLValue?.avoidingExternalReminders !== "not at all"
            ? questionParagraph(
                "What activities do you avoid, in relation to the trauma you have experienced?"
              )
            : undefined,
          req.body?.PCLValue?.avoidingExternalReminders !== "" &&
          req.body?.PCLValue?.avoidingExternalReminders !== "not at all"
            ? answerParagraph(`${req.body?.PCLValue?.avoidActivities}`)
            : undefined,
          questionParagraph(
            "95. Trouble remembering important parts of the stressful experience?"
          ),
          answerParagraph(`${req.body?.PCLValue?.troubleStressfulExperience}`),
          questionParagraph(
            "96. Having strong negative beliefs about yourself, other people, or the world (for example, having thoughts such as: I am bad, there is something seriously wrong with me, no one can be trusted, the world is completely dangerous)?"
          ),
          answerParagraph(`${req.body?.PCLValue?.strongNegativeBeliefs}`),
          questionParagraph(
            "97. Blaming yourself or someone else for the stressful experience or what happened after it?"
          ),
          answerParagraph(`${req.body?.PCLValue?.stressfulExperienceBlaming}`),
          questionParagraph(
            "98. Having strong negative feelings such as fear, horror, anger, guilt, or shame?"
          ),
          answerParagraph(`${req.body?.PCLValue?.strongNegativefeelings}`),
          questionParagraph(
            "99. Loss of interest in activities that you used to enjoy (although this is a repeat question, please answer again)?"
          ),
          answerParagraph(`${req.body?.PCLValue?.lossInterestActivity}`),
          questionParagraph(
            "100. Feeling distant or cut off from other people?"
          ),
          answerParagraph(`${req.body?.PCLValue?.feelingDistantPeople}`),
          questionParagraph(
            "101. Trouble experiencing positive feelings (for example, being unable to feel happiness or have loving feelings for people close to you)?"
          ),
          answerParagraph(
            `${req.body?.PCLValue?.troubleExperiencePositiveFeeling}`
          ),
          questionParagraph(
            "102. Irritable behavior, angry outbursts, or acting aggressively?"
          ),
          answerParagraph(`${req.body?.PCLValue?.irritableBehavior}`),
          questionParagraph(
            "103. Taking too many risks or doing things that could cause you harm?"
          ),
          answerParagraph(`${req.body?.PCLValue?.manyRisksThing}`),
          questionParagraph("104. Being “superalert” or watchful or on guard?"),
          answerParagraph(`${req.body?.PCLValue?.beingWatchful}`),
          questionParagraph("105. Feeling jumpy or easily startled?"),
          answerParagraph(`${req.body?.PCLValue?.easilyStartled}`),
          questionParagraph(
            "106. Having difficulty concentrating (although this is a repeat question, please answer again)?"
          ),
          answerParagraph(`${req.body?.PCLValue?.difficultyConcentrating}`),
          questionParagraph(
            "107. Trouble falling or staying asleep (although this is a repeat question, please answer again)?"
          ),
          answerParagraph(`${req.body?.PCLValue?.troubleFallingAsleep}`),
          questionParagraph(
            "108. With zero to 1 equaling no or minimal symptoms and 10 equaling the most severe symptoms possible, how do you rate your current post-trauma related symptoms?"
          ),
          answerParagraph(`${req.body?.PCLValue?.currentRelatedSymptoms}`),

          TitleParagraph("Current Treatment"),
          questionParagraph(
            "109. Do you currently take any psychiatric medications."
          ),
          answerParagraph(
            `${req.body?.currentTreatmentValue?.currentlyPsychiatricMedications}`
          ),
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "Please list the name(s), dose(s), and how often you take each of these medications."
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                `${req.body?.currentTreatmentValue?.medicationList}`
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "How long have you been taking this medication?"
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                `${req.body?.currentTreatmentValue?.medicationLong}`
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "What is the reason you take these medications you listed above? Select all that apply."
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                `${req.body?.currentTreatmentValue?.medicationReason}`
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
            "Yes" &&
          req.body?.currentTreatmentValue?.medicationReason &&
          req.body?.currentTreatmentValue?.medicationReason.filter(
            (item) => item === "other"
          ).length
            ? questionParagraph(
                "Please explain the reason you take these medications you listed above."
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
            "Yes" &&
          req.body?.currentTreatmentValue?.medicationReason &&
          req.body?.currentTreatmentValue?.medicationReason.filter(
            (item) => item === "other"
          ).length
            ? answerParagraph(
                `${req.body?.currentTreatmentValue?.describeMedicationReason}`
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "The current medications you take have produced the following effects on your condition:"
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                cardFieldType(
                  req.body?.currentTreatmentValue
                    ?.medicationsEffectYourCondition
                )
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "Do you always take the medication as prescribed by your medical provider?"
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                `${req.body?.currentTreatmentValue?.medicationAsPrescribed}`
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "Have you experienced any of the following side effects from your medication(s)?"
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                `${req.body?.currentTreatmentValue?.experiencedSideEffects}`
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
            "Yes" &&
          req.body?.currentTreatmentValue?.experiencedSideEffects &&
          req.body?.currentTreatmentValue?.experiencedSideEffects.filter(
            (item) => item === "other"
          ).length
            ? questionParagraph(
                "You selected 'other,' please describe your side effects here."
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
            "Yes" &&
          req.body?.currentTreatmentValue?.experiencedSideEffects &&
          req.body?.currentTreatmentValue?.experiencedSideEffects.filter(
            (item) => item === "other"
          ).length
            ? answerParagraph(
                `${req.body?.currentTreatmentValue?.describeSideEffect}`
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? questionParagraph(
                "Your current or most recent psychiatric medication treatment provider was (name/facility/clinic):"
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychiatricMedications ===
          "Yes"
            ? answerParagraph(
                `${req.body?.currentTreatmentValue?.recentTreatmentProvider}`
              )
            : undefined,

          questionParagraph(
            "110. Are you currently in psychotherapy treatment?"
          ),
          answerParagraph(
            `${req.body?.currentTreatmentValue?.currentlyPsychotherapyTreatment}`
          ),
          req.body?.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? questionParagraph(
                "When did your current psychotherapy treatment begin?"
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? answerParagraph(
                `${req.body?.currentTreatmentValue?.recentPsychotherapyBegin}`
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? questionParagraph(
                "When was your most recent psychotherapy session?"
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? answerParagraph(
                `${req.body?.currentTreatmentValue?.recentPsychotherapySession}`
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? questionParagraph("I attend psychotherapy sessions:")
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? answerParagraph(
                `${req.body?.currentTreatmentValue?.psychotherapySessionsDate}`
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? questionParagraph(
                "Your current or most recent psychotherapy treatment provider is (name/facility/clinic):"
              )
            : undefined,
          req.body?.currentTreatmentValue?.currentlyPsychotherapyTreatment ===
          "Yes"
            ? answerParagraph(
                `${req.body?.currentTreatmentValue?.psychotherapistTreatmentProvider}`
              )
            : undefined,

          TitleParagraph("Past History"),
          questionParagraph(
            "111. Have you ever previously experienced any of the following symptoms"
          ),
          answerParagraph(
            `${req.body?.pastHistoryValue?.previouslyExperiencedSymptom}`
          ),
          questionParagraph(
            "Please describe your post traumatic stress symptoms at that time:"
          ),
          answerParagraph(`${req.body?.pastHistoryValue?.describeSymptoms}`),
          questionParagraph(
            "112. Have you ever experienced having so much energy that you do not need to sleep for several days or a week at a time?"
          ),
          answerParagraph(
            `${req.body?.pastHistoryValue?.experienceMuchEnergy}`
          ),
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? questionParagraph(
                "During this time, if you slept fewer than 4 hours per night, how many nights did it last?"
              )
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? answerParagraph(`${req.body?.pastHistoryValue?.sleptFewer4Hours}`)
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? questionParagraph(
                "During this time of lack of sleep, how was your energy when awake?"
              )
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? answerParagraph(`${req.body?.pastHistoryValue?.lackSleepEnergy}`)
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? questionParagraph(
                "During this time that you slept fewer than 4 hours per night for 4-7 or more consecutive nights, did you feel excessively tired during the day?"
              )
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? answerParagraph(`${req.body?.pastHistoryValue?.sleepFewer}`)
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? questionParagraph("During this time, how was your mood?")
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? answerParagraph(`${req.body?.pastHistoryValue?.mood}`)
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes" &&
          req.body?.pastHistoryValue?.mood === "other"
            ? questionParagraph("Please describe your mood here.")
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes" &&
          req.body?.pastHistoryValue?.mood === "other"
            ? answerParagraph(`${req.body?.pastHistoryValue?.describeMood}`)
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? questionParagraph(
                "During this high energy time did you engage in any high-risk behaviors?"
              )
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? answerParagraph(`${req.body?.pastHistoryValue?.highEnergyTime}`)
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? questionParagraph(
                "During this time, did you drink alcohol or use any other substances?"
              )
            : undefined,
          req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.alcoholSubstances}`
              )
            : undefined,

          questionParagraph(
            "113. Have you ever experienced any of the following?"
          ),
          answerParagraph(`${req.body?.pastHistoryValue?.experienceFollowing}`),
          req.body?.pastHistoryValue?.experienceFollowing.filter(
            (item) =>
              item ===
              "Had thoughts, behaviors, or rituals that are recurrent, intrusive, and time consuming"
          ).length > 0
            ? questionParagraph(
                "If you have thoughts, behaviors, or rituals that are recurrent, what thoughts, behaviors, or rituals are you having?"
              )
            : undefined,
          req.body?.pastHistoryValue?.experienceFollowing.filter(
            (item) =>
              item ===
              "Had thoughts, behaviors, or rituals that are recurrent, intrusive, and time consuming"
          ).length > 0
            ? answerParagraph(`${req.body?.pastHistoryValue?.recurrentRituals}`)
            : undefined,
          req.body?.pastHistoryValue?.experienceFollowing.length > 0
            ? questionParagraph(
                "When experiencing these symptoms, were you drinking alcohol or using any substances?"
              )
            : undefined,
          req.body?.pastHistoryValue?.experienceFollowing.length > 0
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.symptomsDrinkingAlcohol}`
              )
            : undefined,

          questionParagraph(
            "114. Recently, have you been thinking about how you might harm or kill yourself?"
          ),
          answerParagraph(`${req.body?.pastHistoryValue?.harmKillYourSelf}`),
          questionParagraph(
            "115. Have any of your emotional symptoms (sadness, depression, anxiety) had a negative effect upon your work, school, or relationships?"
          ),
          answerParagraph(
            `${req.body?.pastHistoryValue?.emotionalSymptomsRelationShip}`
          ),
          questionParagraph(
            "116. If you have ever experienced symptoms of depression, when did you first feel depressed?"
          ),
          answerParagraph(`${req.body?.pastHistoryValue?.firstFeelDepressed}`),
          questionParagraph(
            "117. If you have ever experienced symptoms of anxiety, when did you first feel high levels of anxiety?"
          ),
          answerParagraph(
            `${req.body?.pastHistoryValue?.feelHighLevelAnxiety}`
          ),

          questionParagraph(
            "118. Have you ever been diagnosed by a healthcare provider with any of the following mental health conditions?"
          ),
          answerParagraph(
            `${req.body?.pastHistoryValue?.diagnosedMentalHealth}`
          ),
          req.body?.pastHistoryValue?.diagnosedMentalHealth &&
          req.body?.pastHistoryValue?.diagnosedMentalHealth.filter(
            (item) => item === "other"
          ).length
            ? questionParagraph(
                "Please enter your mental health conditions here."
              )
            : undefined,
          req.body?.pastHistoryValue?.diagnosedMentalHealth &&
          req.body?.pastHistoryValue?.diagnosedMentalHealth.filter(
            (item) => item === "other"
          ).length
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.describeHealthCondition}`
              )
            : undefined,

          questionParagraph(
            "119. Have you ever taken any other medications in the past for a psychiatric or mental health condition, not listed above? This may include medications that did not work well or that were stopped for other reasons."
          ),
          answerParagraph(`${req.body?.pastHistoryValue?.otherMedications}`),
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Please list the name(s) of the past medication(s), dose(s), and how often you took the medication."
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.pastMedicationName}`
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Please list the approximate date you started taking the medication (if applicable)"
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.startedMedicationDate}`
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Please list the approximate date you stopped taking the medication (if applicable)"
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.stopedMedicationDate}`
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph("These past psychiatric medication produced:")
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                cardFieldType(
                  req.body?.pastHistoryValue?.pastPsychiatricMedication
                )
              )
            : undefined,

          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Past psychiatric medications were stopped due to:"
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.stopedPsychiatricMedicationsReason}`
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Did a psychiatrist, psychiatric nurse practitionaer, or primacy care clinician prescribe this medication to you?"
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.prescribeThisMedication}`
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Please list the name(s) of your past clinician(s) who prescribed these medication(s) and dates you saw them."
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.prescribeThisMedicationNameDate}`
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph("At what clinic or office did they work at?")
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(`${req.body?.pastHistoryValue?.whatClinicWorked}`)
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "Please list any other psychiatrists you have ever seen."
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.otherPsychiatrists}`
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "From what date(s) to what date(s) did you see these psychiatrists?"
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.thisPsychiatristSeeDate}`
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? questionParagraph(
                "During this psychiatric treatment, how often did you attend sessions with your psychiatrist?"
              )
            : undefined,
          req.body?.pastHistoryValue?.otherMedications === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.attendedSessionsPsychiatrist}`
              )
            : undefined,

          questionParagraph(
            "120. Have you ever previously received psychotherapy (talk therapy/counseling)?"
          ),
          answerParagraph(
            `${req.body?.pastHistoryValue?.previouslyReceivedPsychotherapy}`
          ),

          req.body?.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? questionParagraph(
                "If you have ever received psychotherapy, when did your psychotherapy begin?"
              )
            : undefined,
          req.body?.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.receivedPsychotherapyBegin}`
              )
            : undefined,

          req.body?.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? questionParagraph("How long did you receive psychotherapy?")
            : undefined,
          req.body?.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.receivedPsychotherapyLong}`
              )
            : undefined,

          req.body?.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? questionParagraph(
                "During this psychotherapy treatment, how often did you attend these sessions:"
              )
            : undefined,
          req.body?.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.attendedSessionsPsychotherapy}`
              )
            : undefined,

          req.body?.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? questionParagraph(
                "Please list the names of your past psychotherapists and dates you saw them."
              )
            : undefined,
          req.body?.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.pastPsychotherapistsDate}`
              )
            : undefined,

          req.body?.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? questionParagraph(
                "Please describe any other psychotherapy treatment not listed above:"
              )
            : undefined,
          req.body?.pastHistoryValue?.previouslyReceivedPsychotherapy === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.otherPsychotherapyTreatmentList}`
              )
            : undefined,

          questionParagraph(
            "121. Have you ever been admitted to a psychiatric hospital?"
          ),
          answerParagraph(
            `${req.body?.pastHistoryValue?.admittedPsychiatricHospital}`
          ),

          req.body?.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? questionParagraph(
                "Please list the reason for the psychiatric hospitalization"
              )
            : undefined,
          req.body?.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.psychiatricHospitalizationReason}`
              )
            : undefined,

          req.body?.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? questionParagraph(
                "Please list the treatment you received during the psychiatric hospitalization"
              )
            : undefined,
          req.body?.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.receivedTreatment}`
              )
            : undefined,

          req.body?.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? questionParagraph(
                "Please list the name(s) of the hospital you were admitted to. If there is more than one instance, please list the information for all admissions."
              )
            : undefined,
          req.body?.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.admittedHospitalName}`
              )
            : undefined,

          req.body?.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? questionParagraph(
                "Please list the dates or year(s) in which you were hospitalized"
              )
            : undefined,
          req.body?.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? answerParagraph(`${req.body?.pastHistoryValue?.hospitalizedDate}`)
            : undefined,

          req.body?.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? questionParagraph(
                "Please list how long you were hospitalized on each occasion"
              )
            : undefined,
          req.body?.pastHistoryValue?.admittedPsychiatricHospital === "Yes"
            ? answerParagraph(`${req.body?.pastHistoryValue?.hospitalizedLong}`)
            : undefined,

          questionParagraph(
            "122. Have you ever experienced suicidal ideation?"
          ),
          answerParagraph(`${req.body?.pastHistoryValue?.suicidalIdeation}`),
          questionParagraph("123. Have you ever made a suicide attempt?"),
          answerParagraph(`${req.body?.pastHistoryValue?.suicideAttempt}`),
          req.body?.pastHistoryValue?.suicideAttempt === "Yes"
            ? questionParagraph(
                "If yes, how many times have you attempted suicide?"
              )
            : undefined,
          req.body?.pastHistoryValue?.suicideAttempt === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.attemptedSuicideTimes}`
              )
            : undefined,
          req.body?.pastHistoryValue?.suicideAttempt === "Yes"
            ? questionParagraph(
                "How did you attempt suicide (list all methods ever used)?"
              )
            : undefined,
          req.body?.pastHistoryValue?.suicideAttempt === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.suicideAllMethods}`
              )
            : undefined,
          req.body?.pastHistoryValue?.suicideAttempt === "Yes"
            ? questionParagraph(
                "When was the most recent time you attempted suicide?"
              )
            : undefined,
          req.body?.pastHistoryValue?.suicideAttempt === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.attemptedSuicideDate}`
              )
            : undefined,

          questionParagraph(
            "124. Have you ever experienced any other psychiatric symptoms that are not described above"
          ),
          answerParagraph(
            `${req.body?.pastHistoryValue?.otherPsychiatricSymptoms}`
          ),
          req.body?.pastHistoryValue?.otherPsychiatricSymptoms === "Yes"
            ? questionParagraph(
                "Please describe the psychiatric symptoms you experienced that were not previously identified above:"
              )
            : undefined,
          req.body?.pastHistoryValue?.otherPsychiatricSymptoms === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.describeOtherPsychiatricSymptoms}`
              )
            : undefined,

          questionParagraph(
            "125. Have you received any other psychotherapy or psychiatric medication treatment besides that described above?"
          ),
          answerParagraph(
            `${req.body?.pastHistoryValue?.otherPsychotherapyTreatment}`
          ),
          req.body?.pastHistoryValue?.otherPsychotherapyTreatment === "Yes"
            ? questionParagraph(
                "Please describe the additional psychotherapy or psychiatric medication treatment that was not described above"
              )
            : undefined,
          req.body?.pastHistoryValue?.otherPsychotherapyTreatment === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.describeOtherPsychotherapyTreatment}`
              )
            : undefined,

          questionParagraph(
            "126. Have you ever been evaluated otherwise by psychiatrists or psychologists for any other purpose?"
          ),
          answerParagraph(
            `${req.body?.pastHistoryValue?.evaluatedOtherwisePsychiatrists}`
          ),
          req.body?.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? questionParagraph(
                "Please describe the reason for this psychiatric or psychotherapy evaluation."
              )
            : undefined,
          req.body?.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? answerParagraph(`${req.body?.pastHistoryValue?.evaluationReason}`)
            : undefined,
          req.body?.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? questionParagraph("Who performed this evaluation?")
            : undefined,
          req.body?.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.evaluationPerformed}`
              )
            : undefined,
          req.body?.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? questionParagraph("When did this evaluation occur?")
            : undefined,
          req.body?.pastHistoryValue?.evaluatedOtherwisePsychiatrists === "Yes"
            ? answerParagraph(`${req.body?.pastHistoryValue?.evaluationOccur}`)
            : undefined,

          questionParagraph(
            "127. Have you ever been involved in physical altercations or violence?"
          ),
          answerParagraph(
            `${req.body?.pastHistoryValue?.physicalAltercations}`
          ),
          req.body?.pastHistoryValue?.physicalAltercations === "Yes"
            ? questionParagraph(
                "How many physical altercations have you been involved in?"
              )
            : undefined,
          req.body?.pastHistoryValue?.physicalAltercations === "Yes"
            ? answerParagraph(
                `${req.body?.pastHistoryValue?.physicialAltercationsMany}`
              )
            : undefined,

          TitleParagraph("Substance Use"),
          questionParagraph(
            "128. Have you ever used any of the following substances?"
          ),
          answerParagraph(
            `${req.body?.substanceUseValue?.followingSubstances}`
          ),
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "How often do you currently use each substance?"
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                cardFieldType(req.body?.substanceUseValue?.currentlySubstance)
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "Please list how much you use of each substance."
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                cardFieldType(req.body?.substanceUseValue?.eachSubstanceList)
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "Please list how old you were when you started using each substance."
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                cardFieldType(
                  req.body?.substanceUseValue?.eachSubstanceListStartedOld
                )
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "When did you last use each of these substances?"
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                cardFieldType(req.body?.substanceUseValue?.eachSubstanceLast)
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "Do you have a history of experiencing tolerance (needing more to get the same effect) from any of the following substances?"
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                cardFieldType(
                  req.body?.substanceUseValue?.toleranceFollowingSubstances
                )
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "Do you have a history of experiencing withdrawal symptoms from any of the following substances?"
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                cardFieldType(
                  req.body?.substanceUseValue?.withdrawalFollowingSubstances
                )
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? questionParagraph(
                "Regarding your alcohol or substance use, have you experienced any of the following (check all that apply)?"
              )
            : undefined,
          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? answerParagraph(
                `${regardingAlcohol(
                  req.body?.substanceUseValue?.regardingAlcoholAnyFollowing,
                  req.body?.substanceUseValue?.toleranceDefinedFollowing,
                  req.body?.substanceUseValue?.withdrawalEitherFollowing
                )}`
              )
            : undefined,

          questionParagraph(
            "129. Have you ever enrolled in a substance recovery treatment program?"
          ),
          answerParagraph(
            `${req.body?.substanceUseValue?.enrolledTreatmentProgram}`
          ),
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph("Did you complete this treatment program?")
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body?.substanceUseValue?.completeTreatmentProgram}`
              )
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph(
                "This treatment lasted from what date to what date?"
              )
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph("From:")
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body?.substanceUseValue?.treatmentLastedDateFrom}`
              )
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph("To:")
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body?.substanceUseValue?.treatmentLastedDateTo}`
              )
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph(
                "Following this treatment you remained clean and sober for how long?"
              )
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body?.substanceUseValue?.remainedTreatmentClean}`
              )
            : undefined,

          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph(
                "This clean and sober period lasted from when to when?"
              )
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph("From:")
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body?.substanceUseValue?.cleanSoberLastedFrom}`
              )
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph("To:")
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body?.substanceUseValue?.cleanSoberLastedTo}`
              )
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph(
                "What is the longest that you have ever remained completely clean and sober from all alcohol and substance use?"
              )
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body?.substanceUseValue?.remainedTreatmentCleanLongest}`
              )
            : undefined,

          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph(
                "When was this longest period of remaining clean and sober?"
              )
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body?.substanceUseValue?.cleanSoberLongest}`
              )
            : undefined,

          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? questionParagraph(
                "While you were clean and sober, did you continue to experience any of your previously described psychiatric symptoms, such as depression and/or anxiety?"
              )
            : undefined,
          req.body?.substanceUseValue?.enrolledTreatmentProgram === "Yes"
            ? answerParagraph(
                `${req.body?.substanceUseValue?.previouslyDescribedPsychiatricClean}`
              )
            : undefined,

          TitleParagraph("Medical History"),
          questionParagraph(
            "130. Have you been diagnosed by a healthcare provider with any of the following conditions?"
          ),
          answerParagraph(
            `${req.body?.medicalHistoryValue?.diagnosedHealthcareProvider}`
          ),
          req.body?.demographicInformation?.radioSexItem === "Female"
            ? questionParagraph(
                "Are you pregnant, planning on getting pregnant, or breastfeeding?"
              )
            : undefined,
          req.body?.demographicInformation?.radioSexItem === "Female"
            ? answerParagraph(
                `${req.body?.medicalHistoryValue?.pregnantPlanning}`
              )
            : undefined,
          req.body?.demographicInformation?.radioSexItem === "Female" &&
          req.body?.medicalHistoryValue?.pregnantPlanning === "Yes"
            ? questionParagraph(
                "Are you currently engaged with a healthcare provider regarding your current or planned pregnancy?"
              )
            : undefined,
          req.body?.demographicInformation?.radioSexItem === "Female" &&
          req.body?.medicalHistoryValue?.pregnantPlanning === "Yes"
            ? answerParagraph(
                `${req.body?.medicalHistoryValue?.plannedPregnancyProvider}`
              )
            : undefined,

          questionParagraph(
            "131. Please list your general physical health medications, including your dosage for each medication:"
          ),
          answerParagraph(
            `${req.body?.medicalHistoryValue?.physicalHealthMedicationsLists}`
          ),

          questionParagraph(
            "132. Have your general medical medications produced any side effects?"
          ),
          answerParagraph(
            `${req.body?.medicalHistoryValue?.medicationsSideEffect}`
          ),

          questionParagraph("133. Have you ever had any surgeries?"),
          answerParagraph(`${req.body?.medicalHistoryValue?.surgeries}`),
          req.body?.medicalHistoryValue?.surgeries === "Yes"
            ? questionParagraph(
                "Please list your previous surgeries with dates when possible."
              )
            : undefined,
          req.body?.medicalHistoryValue?.surgeries === "Yes"
            ? answerParagraph(
                `${req.body?.medicalHistoryValue?.surgeriesDateList}`
              )
            : undefined,

          questionParagraph(
            "134. Do your treatment providers have any plans for your future medical care?"
          ),
          answerParagraph(
            `${req.body?.medicalHistoryValue?.futureMedicalPlan}`
          ),
          req.body?.medicalHistoryValue?.futureMedicalPlan === "Yes"
            ? questionParagraph(
                "Please list your planned planned future medical care"
              )
            : undefined,
          req.body?.medicalHistoryValue?.futureMedicalPlan === "Yes"
            ? answerParagraph(
                `${req.body?.medicalHistoryValue?.futureMedicalPlanList}`
              )
            : undefined,

          questionParagraph(
            "135. Your current primary care physician or nurse practitioner is (Name, Facility, City):"
          ),
          answerParagraph(
            `${req.body?.medicalHistoryValue?.currentPrimarycarePractitioner}`
          ),
          questionParagraph(
            "136. Past primary care physician or nurse practitioners (Name, Facility, City)?"
          ),
          answerParagraph(
            `${req.body?.medicalHistoryValue?.pastprimarycarePractitioner}`
          ),
          questionParagraph(
            "During what time period did you receive this care from each provider?"
          ),
          answerParagraph(
            `${req.body?.medicalHistoryValue?.periodReceiveProvider}`
          ),
          questionParagraph(
            "137. List all of the hospitals you have ever been in for medical reasons (and when you were in this hospital):"
          ),
          answerParagraph(
            `${req.body?.medicalHistoryValue?.hospitalListEverBeen}`
          ),

          questionParagraph(
            "138. Do you have any allergies or intolerances to medication or food?"
          ),
          answerParagraph(
            `${req.body?.medicalHistoryValue?.allergiesMedication}`
          ),
          req.body?.medicalHistoryValue?.allergiesMedication === "Yes"
            ? questionParagraph("Please list your intolerances or allergies.")
            : undefined,
          req.body?.medicalHistoryValue?.allergiesMedication === "Yes"
            ? answerParagraph(`${req.body?.medicalHistoryValue?.allergiesList}`)
            : undefined,

          TitleParagraph("Family History"),
          questionParagraph(
            "139. Do any of your family members suffer from the following psychiatric conditions?"
          ),
          answerParagraph(
            `${req.body?.familyHistoryValue?.familyPsychiatricConditions}`
          ),
          req.body?.familyHistoryValue?.familyPsychiatricConditions.filter(
            (item) => item === "other"
          ).length > 0
            ? questionParagraph(
                "Please list any other psychiatric conditions your family members have been diagnosed with."
              )
            : undefined,
          req.body?.familyHistoryValue?.familyPsychiatricConditions.filter(
            (item) => item === "other"
          ).length > 0
            ? answerParagraph(
                `${req.body?.familyHistoryValue?.psychiatricConditionsList}`
              )
            : undefined,
          req.body?.familyHistoryValue?.familyPsychiatricConditions.filter(
            (item) => item === "other"
          ).length > 0
            ? questionParagraph(
                "If there is a family history of psychiatric conditions, please provide their treatment received, if known."
              )
            : undefined,
          req.body?.familyHistoryValue?.familyPsychiatricConditions.filter(
            (item) => item === "other"
          ).length > 0
            ? answerParagraph(
                `${req.body?.familyHistoryValue?.psychiatricConditionsTreatment}`
              )
            : undefined,

          questionParagraph(
            "140. Have any of your family members attempted or committed suicide?"
          ),
          answerParagraph(
            `${req.body?.familyHistoryValue?.familyAttemptedSuicide}`
          ),

          TitleParagraph("Relationship History"),
          questionParagraph(
            "141. Are you currently involved in an intimate relationship?"
          ),
          answerParagraph(
            `${req.body?.relationshipHistoryValue?.currentlyIntimateRelationship}`
          ),
          req.body?.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? questionParagraph("Are you currently married?")
            : undefined,
          req.body?.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? answerParagraph(
                `${req.body?.relationshipHistoryValue?.currentlyMarried}`
              )
            : undefined,
          req.body?.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? questionParagraph(
                "How long have you been involved in your current relationship?"
              )
            : undefined,
          req.body?.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? answerParagraph(
                `${req.body?.relationshipHistoryValue?.currentRelationshipInvolve} ${req.body?.relationshipHistoryValue?.currentlyUnit}`
              )
            : undefined,
          req.body?.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? questionParagraph(
                "If yes, how would you describe your current intimate relationship?"
              )
            : undefined,
          req.body?.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? answerParagraph(
                `${req.body?.relationshipHistoryValue?.describeIntimateRelationship}`
              )
            : undefined,
          req.body?.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? questionParagraph("What Is Your Spouse or Partner's Occupation?")
            : undefined,
          req.body?.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? answerParagraph(
                `${req.body?.relationshipHistoryValue?.PartnerOccupation}`
              )
            : undefined,

          req.body?.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? questionParagraph(
                "Does your spouse or partner suffer from any general medical or psychiatric conditions (without naming their condition)?"
              )
            : undefined,
          req.body?.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? answerParagraph(
                `${req.body?.relationshipHistoryValue?.sufferPsychiatricConditions}`
              )
            : undefined,

          req.body?.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? questionParagraph(
                "Is your partner or spouse’s medical or psychiatric condition stressful for you?"
              )
            : undefined,
          req.body?.relationshipHistoryValue?.currentlyIntimateRelationship ===
          "Yes"
            ? answerParagraph(
                `${req.body?.relationshipHistoryValue?.stressfulPsychiatricConditions}`
              )
            : undefined,

          questionParagraph("142. How many times have you been married?"),
          answerParagraph(
            `${req.body?.relationshipHistoryValue?.marriedNumber}`
          ),
          questionParagraph(
            "143. How many total long term intimate relationships have you had?"
          ),
          answerParagraph(
            `${req.body?.relationshipHistoryValue?.intimateRelationshipTimes}`
          ),
          questionParagraph(
            "How long did each of your long term relationships last?"
          ),
          answerParagraph(
            `${req.body?.relationshipHistoryValue?.longTermRelationshipsLast}`
          ),
          questionParagraph(
            "What are the reasons that your previous relationships/marriage ended?"
          ),
          answerParagraph(
            `${req.body?.relationshipHistoryValue?.reasonPreviousRelationships}`
          ),
          questionParagraph(
            "Has there ever been domestic violence in any of your relationships?"
          ),
          answerParagraph(
            `${req.body?.relationshipHistoryValue?.domesticViolence}`
          ),

          questionParagraph("144. Do you have children?"),
          answerParagraph(
            `${req.body?.relationshipHistoryValue?.haveChildren}`
          ),
          req.body?.relationshipHistoryValue?.haveChildren === "Yes"
            ? questionParagraph(
                "How many children do you have and what are their ages?"
              )
            : undefined,
          req.body?.relationshipHistoryValue?.haveChildren === "Yes"
            ? answerParagraph(
                `${req.body?.relationshipHistoryValue?.childrenNumberAndAge}`
              )
            : undefined,
          req.body?.relationshipHistoryValue?.haveChildren === "Yes"
            ? questionParagraph(
                "How are your children doing in school or work?"
              )
            : undefined,
          req.body?.relationshipHistoryValue?.haveChildren === "Yes"
            ? answerParagraph(
                `${req.body?.relationshipHistoryValue?.childrenDoingSchool}`
              )
            : undefined,
          req.body?.relationshipHistoryValue?.haveChildren === "Yes"
            ? questionParagraph(
                "What is your relationship like with your children?"
              )
            : undefined,
          req.body?.relationshipHistoryValue?.haveChildren === "Yes"
            ? answerParagraph(
                `${req.body?.relationshipHistoryValue?.relationshipChildren}`
              )
            : undefined,
          req.body?.relationshipHistoryValue?.haveChildren === "Yes"
            ? questionParagraph(
                "Do any of your children have any general or mental health issues?"
              )
            : undefined,
          req.body?.relationshipHistoryValue?.haveChildren === "Yes"
            ? answerParagraph(
                `${req.body?.relationshipHistoryValue?.childrenHealthIssues}`
              )
            : undefined,

          TitleParagraph("Employment History"),
          questionParagraph("145. What is your current employment status?"),
          answerParagraph(
            `${req.body?.employmentHistoryValue?.currentEmploymentStatus}`
          ),
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at less than 20 hours per week" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at more than 20 hours per week, but not full time" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed full time"
            ? questionParagraph("What is the name of your employer?")
            : undefined,
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at less than 20 hours per week" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at more than 20 hours per week, but not full time" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed full time"
            ? answerParagraph(
                `${req.body?.employmentHistoryValue?.employerName}`
              )
            : undefined,
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at less than 20 hours per week" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at more than 20 hours per week, but not full time" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed full time"
            ? questionParagraph(
                "What is your employment title at this position?"
              )
            : undefined,
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at less than 20 hours per week" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at more than 20 hours per week, but not full time" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed full time"
            ? answerParagraph(
                `${req.body?.employmentHistoryValue?.employmentTitle}`
              )
            : undefined,
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at less than 20 hours per week" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at more than 20 hours per week, but not full time" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed full time"
            ? questionParagraph("What are your job duties?")
            : undefined,
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at less than 20 hours per week" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at more than 20 hours per week, but not full time" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed full time"
            ? answerParagraph(`${req.body?.employmentHistoryValue?.jobDuties}`)
            : undefined,
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at less than 20 hours per week" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at more than 20 hours per week, but not full time" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed full time"
            ? questionParagraph(
                "Are you having any difficulty performing your job duties?"
              )
            : undefined,
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at less than 20 hours per week" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed at more than 20 hours per week, but not full time" ||
          req.body?.employmentHistoryValue?.currentEmploymentStatus ===
            "employed full time"
            ? answerParagraph(
                `${req.body?.employmentHistoryValue?.difficultyJobDuties}`
              )
            : undefined,

          questionParagraph(
            "146. What is the name of your past employer immediately prior to any current job you may have?"
          ),
          table(req.body?.employmentHistoryValue?.employerList),

          questionParagraph("147. Have you had any past workplace injuries?"),
          answerParagraph(
            `${req.body?.employmentHistoryValue?.pastWorkplaceInjuries}`
          ),
          req.body?.employmentHistoryValue?.pastWorkplaceInjuries === "Yes"
            ? questionParagraph("When did this or these injuries occur?")
            : undefined,
          req.body?.employmentHistoryValue?.pastWorkplaceInjuries === "Yes"
            ? answerParagraph(
                `${req.body?.employmentHistoryValue?.injuriesOccurTime}`
              )
            : undefined,
          req.body?.employmentHistoryValue?.pastWorkplaceInjuries === "Yes"
            ? questionParagraph(
                "What as the nature of this injury or injuries?"
              )
            : undefined,
          req.body?.employmentHistoryValue?.pastWorkplaceInjuries === "Yes"
            ? answerParagraph(
                `${req.body?.employmentHistoryValue?.injuryNature}`
              )
            : undefined,

          questionParagraph(
            "148. Have you ever submitted a Workers’ Compensation claim"
          ),
          answerParagraph(
            `${req.body?.employmentHistoryValue?.workerCompensationClaim}`
          ),
          questionParagraph("149. Have you ever been placed on disability?"),
          answerParagraph(
            `${req.body?.employmentHistoryValue?.placedDisability}`
          ),

          req.body?.employmentHistoryValue?.placedDisability === "Yes"
            ? questionParagraph("What were the dates of this disability?")
            : undefined,
          req.body?.employmentHistoryValue?.placedDisability === "Yes"
            ? answerParagraph(
                `${req.body?.employmentHistoryValue?.disabilityDates}`
              )
            : undefined,

          questionParagraph(
            "150. Have you ever received negative work evaluations, been terminated from a position, or received disciplinary action?"
          ),
          answerParagraph(
            `${req.body?.employmentHistoryValue?.receivedNegativeWork}`
          ),

          req.body?.employmentHistoryValue?.receivedNegativeWork === "Yes"
            ? questionParagraph("Please explain:")
            : undefined,
          req.body?.employmentHistoryValue?.receivedNegativeWork === "Yes"
            ? answerParagraph(
                `${req.body?.employmentHistoryValue?.workEvaluationsExplain}`
              )
            : undefined,

          questionParagraph("151. List all of your current sources of income."),
          answerParagraph(
            `${req.body?.employmentHistoryValue?.currentSourcesIncome}`
          ),

          TitleParagraph("Education History"),
          questionParagraph("152. What is your highest level of education?"),
          answerParagraph(
            `${req.body?.educationHistoryValue?.highestLevelEducation}`
          ),
          req.body?.educationHistoryValue?.highestLevelEducation ===
          "Currently a student"
            ? questionParagraph(
                "If you are currently enrolled in an education program, please describe:"
              )
            : undefined,
          req.body?.educationHistoryValue?.highestLevelEducation ===
          "Currently a student"
            ? answerParagraph(
                `${req.body?.educationHistoryValue?.currentlyEnrolledEducation}`
              )
            : undefined,

          questionParagraph(
            "153. What grades did you mostly receive during your education (choose all that apply)?"
          ),
          answerParagraph(
            `${req.body?.educationHistoryValue?.mostlyReceiveGrade}`
          ),

          questionParagraph(
            "154. Were you ever identified as having a learning disability, or placed in any special education classes?"
          ),
          answerParagraph(
            `${req.body?.educationHistoryValue?.learningDisability}`
          ),
          req.body?.educationHistoryValue?.learningDisability === "Yes"
            ? questionParagraph("Please describe your learning difficulties?")
            : undefined,
          req.body?.educationHistoryValue?.learningDisability === "Yes"
            ? answerParagraph(
                `${req.body?.educationHistoryValue?.describeLearningDifficulties}`
              )
            : undefined,

          questionParagraph("155. Did you graduate high school?"),
          answerParagraph(
            `${req.body?.educationHistoryValue?.graduateHighSchool}`
          ),
          req.body?.educationHistoryValue?.graduateHighSchool === "Yes"
            ? questionParagraph("Did you graduate on time?")
            : undefined,
          req.body?.educationHistoryValue?.graduateHighSchool === "Yes"
            ? answerParagraph(
                `${req.body?.educationHistoryValue?.graduateOnTime}`
              )
            : undefined,

          questionParagraph("156. Did you go to college"),
          answerParagraph(`${req.body?.educationHistoryValue?.goToCollege}`),
          req.body?.educationHistoryValue?.goToCollege === "Yes"
            ? questionParagraph("If so, did you complete your degree?")
            : undefined,
          req.body?.educationHistoryValue?.goToCollege === "Yes"
            ? answerParagraph(
                `${req.body?.educationHistoryValue?.completeYourDegree}`
              )
            : undefined,
          req.body?.educationHistoryValue?.goToCollege === "Yes"
            ? questionParagraph("Name of college:")
            : undefined,
          req.body?.educationHistoryValue?.goToCollege === "Yes"
            ? answerParagraph(`${req.body?.educationHistoryValue?.collegeName}`)
            : undefined,
          req.body?.educationHistoryValue?.goToCollege === "Yes"
            ? questionParagraph("College major or primary topic of study:")
            : undefined,
          req.body?.educationHistoryValue?.goToCollege === "Yes"
            ? answerParagraph(
                `${req.body?.educationHistoryValue?.collegeMajor}`
              )
            : undefined,

          TitleParagraph("Social History"),
          questionParagraph(
            "157. Are you experiencing any barriers to receiving healthcare?"
          ),
          answerParagraph(
            `${req.body?.socialHistoryValue?.barriersReceivingHealthcare}`
          ),

          req.body?.socialHistoryValue?.barriersReceivingHealthcare === "Yes"
            ? questionParagraph(
                "Please select the barriers to healthcare you are experiencing:"
              )
            : undefined,
          req.body?.socialHistoryValue?.barriersReceivingHealthcare === "Yes"
            ? answerParagraph(
                `${req.body?.socialHistoryValue?.selectbarriersHealthcare}`
              )
            : undefined,

          questionParagraph(
            "158. Please describe your current living situation(select all that apply):"
          ),
          answerParagraph(
            `${req.body?.socialHistoryValue?.describeCurrentLivingSituation}`
          ),
          req.body?.socialHistoryValue?.describeCurrentLivingSituation
            .length !== 0 &&
          !(
            req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
              (item) => item === "homeless"
            ).length > 0
          ) &&
          !(
            req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
              (item) => item === "living alone"
            ).length > 0
          )
            ? questionParagraph("Who else lives in your home with you?")
            : undefined,
          req.body?.socialHistoryValue?.describeCurrentLivingSituation
            .length !== 0 &&
          !(
            req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
              (item) => item === "homeless"
            ).length > 0
          ) &&
          !(
            req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
              (item) => item === "living alone"
            ).length > 0
          )
            ? answerParagraph(`${req.body?.socialHistoryValue?.livesYourHome}`)
            : undefined,

          req.body?.socialHistoryValue?.describeCurrentLivingSituation
            .length !== 0 &&
          !(
            req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
              (item) => item === "homeless"
            ).length > 0
          ) &&
          !(
            req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
              (item) => item === "living alone"
            ).length > 0
          )
            ? questionParagraph("Do You Own Your Home?")
            : undefined,
          req.body?.socialHistoryValue?.describeCurrentLivingSituation
            .length !== 0 &&
          !(
            req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
              (item) => item === "homeless"
            ).length > 0
          ) &&
          !(
            req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
              (item) => item === "living alone"
            ).length > 0
          )
            ? answerParagraph(`${req.body?.socialHistoryValue?.ownYourHome}`)
            : undefined,
          // req.body?.socialHistoryValue?.describeCurrentLivingSituation.length !==
          //   0 &&
          // req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
          //   (item) => item !== "homeless" && item !== "other"
          // ).length > 0
          //   ? questionParagraph(
          //       "Please describe the additional stressors in your life, not already covered above:"
          //     )
          //   : undefined,
          // req.body?.socialHistoryValue?.describeCurrentLivingSituation.length !==
          //   0 &&
          // req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
          //   (item) => item !== "homeless" && item !== "other"
          // ).length > 0
          //   ? answerParagraph(
          //       `${req.body?.socialHistoryValue?.describeAdditionalStressors}`
          //     )
          //   : undefined,

          questionParagraph(
            "159. Do you feel that you are in any danger at the present time?"
          ),
          answerParagraph(`${req.body?.socialHistoryValue?.presentTimeDanger}`),
          req.body?.socialHistoryValue?.presentTimeDanger === "Yes"
            ? questionParagraph(
                "Please describe the situation in which you feel in danger."
              )
            : undefined,
          req.body?.socialHistoryValue?.presentTimeDanger === "Yes"
            ? answerParagraph(
                `${req.body?.socialHistoryValue?.describeFeelDanger}`
              )
            : undefined,

          questionParagraph(
            "160. List ALL stressors NOT related to work which happened in the past year (i.e., separation/divorce, death in family, problems with children, financial, foreclosure, bankruptcy, repossessions, etc)."
          ),
          answerParagraph(
            `${req.body?.socialHistoryValue?.allStressorsPastYear}`
          ),
          questionParagraph(
            "Did these stressors affect your emotional symptoms"
          ),
          answerParagraph(
            `${req.body?.socialHistoryValue?.eachStressorsAffect}`
          ),
          questionParagraph(
            "How did each of these stressors affect your emotional symptoms?"
          ),
          answerParagraph(`${req.body?.socialHistoryValue?.stressorsAffect}`),

          questionParagraph(
            "161. Since Your Injury, Have You Experienced Any Other Stressors Besides Your Injury or Psychiatric Issue?"
          ),
          answerParagraph(
            `${req.body?.socialHistoryValue?.otherStressorsBesides}`
          ),
          req.body?.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? questionParagraph(
                "Please explain all of the stressors in your life?"
              )
            : undefined,
          req.body?.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? answerParagraph(
                `${req.body?.socialHistoryValue?.explainAllStressors}`
              )
            : undefined,
          req.body?.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? questionParagraph(
                "Did these stressors affect your emotional symptoms"
              )
            : undefined,
          req.body?.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? answerParagraph(
                `${req.body?.socialHistoryValue?.affectEmotionalSymptoms}`
              )
            : undefined,
          req.body?.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? questionParagraph(
                "How did each of these stressors affect your emotional symptoms?"
              )
            : undefined,
          req.body?.socialHistoryValue?.otherStressorsBesides === "Yes"
            ? answerParagraph(
                `${req.body?.socialHistoryValue?.eachAffectEmotionalSymptoms}`
              )
            : undefined,

          questionParagraph(
            "162. Are you experiencing any other stressors in your life not covered above?"
          ),
          answerParagraph(
            `${req.body?.socialHistoryValue?.otherStressorsExperience}`
          ),
          req.body?.socialHistoryValue?.otherStressorsExperience === "Yes"
            ? questionParagraph("Explain:")
            : undefined,
          req.body?.socialHistoryValue?.otherStressorsExperience === "Yes"
            ? answerParagraph(
                `${req.body?.socialHistoryValue?.explainStressorsExperience}`
              )
            : undefined,

          TitleParagraph("Criminal History"),
          questionParagraph("163. Have you ever been arrested?"),
          answerParagraph(`${req.body?.criminalHistoryValue?.arrested}`),

          req.body?.criminalHistoryValue?.arrested === "Yes"
            ? questionParagraph("When were your arrests?")
            : undefined,
          req.body?.criminalHistoryValue?.arrested === "Yes"
            ? answerParagraph(`${req.body?.criminalHistoryValue?.arrestedDate}`)
            : undefined,

          req.body?.criminalHistoryValue?.arrested === "Yes"
            ? questionParagraph("What were the charges?")
            : undefined,
          req.body?.criminalHistoryValue?.arrested === "Yes"
            ? answerParagraph(`${req.body?.criminalHistoryValue?.charges}`)
            : undefined,
          req.body?.criminalHistoryValue?.arrested === "Yes"
            ? questionParagraph(
                "Were you ever incarcerated? If yes, for how long?"
              )
            : undefined,
          req.body?.criminalHistoryValue?.arrested === "Yes"
            ? answerParagraph(
                `${req.body?.criminalHistoryValue?.everIncarcerated}`
              )
            : undefined,
          req.body?.criminalHistoryValue?.arrested === "Yes"
            ? questionParagraph("Are you currently on parole or probation?")
            : undefined,
          req.body?.criminalHistoryValue?.arrested === "Yes"
            ? answerParagraph(
                `${req.body?.criminalHistoryValue?.currentlyParole}`
              )
            : undefined,

          TitleParagraph("Violence History"),
          questionParagraph(
            "164. Have you ever been involved in physical altercations?"
          ),
          answerParagraph(
            `${req.body?.violenceHistoryValue?.physicalAltercations}`
          ),
          req.body?.violenceHistoryValue?.physicalAltercations === "Yes"
            ? questionParagraph(
                "How many altercations have you been involved in?"
              )
            : undefined,
          req.body?.violenceHistoryValue?.physicalAltercations === "Yes"
            ? answerParagraph(
                `${req.body?.violenceHistoryValue?.altercationsTimes}`
              )
            : undefined,
          req.body?.violenceHistoryValue?.physicalAltercations === "Yes"
            ? questionParagraph(
                "What were the circumstances surrounding these altercations?"
              )
            : undefined,
          req.body?.violenceHistoryValue?.physicalAltercations === "Yes"
            ? answerParagraph(
                `${req.body?.violenceHistoryValue?.circumstancesSurrounding}`
              )
            : undefined,

          questionParagraph(
            "165. Do you currently or have you recently had thoughts of wanting to hurt anyone?"
          ),
          answerParagraph(
            `${req.body?.violenceHistoryValue?.thoughtsHurtAnyone}`
          ),
          req.body?.violenceHistoryValue?.thoughtsHurtAnyone === "Yes"
            ? questionParagraph(
                "Please explain who you want to hurt and how you may go about accomplishing this"
              )
            : undefined,
          req.body?.violenceHistoryValue?.thoughtsHurtAnyone === "Yes"
            ? answerParagraph(
                `${req.body?.violenceHistoryValue?.explainAccomplishingHurt}`
              )
            : undefined,

          questionParagraph("166. Have you ever been the victim of violence?"),
          answerParagraph(`${req.body?.violenceHistoryValue?.victimViolence}`),
          req.body?.violenceHistoryValue?.thoughtsHurtAnyone === "Yes"
            ? questionParagraph("Are you currently in danger of violence?")
            : undefined,
          req.body?.violenceHistoryValue?.thoughtsHurtAnyone === "Yes"
            ? answerParagraph(
                `${req.body?.violenceHistoryValue?.currentlyDangerViolence}`
              )
            : undefined,

          TitleParagraph("Military History"),
          questionParagraph("167. Have you ever enrolled in the military"),
          answerParagraph(
            `${req.body?.militaryHistoryValue?.enrolledMilitary}`
          ),
          req.body?.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? questionParagraph("Which branch of the military were you in?")
            : undefined,
          req.body?.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? answerParagraph(
                `${req.body?.militaryHistoryValue?.branchMilitary}`
              )
            : undefined,
          req.body?.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? questionParagraph("What dates were you in the military?")
            : undefined,
          req.body?.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? answerParagraph(
                `from ${req.body?.militaryHistoryValue?.militaryDatesFrom} to ${req.body?.militaryHistoryValue?.militaryDatesTo} `
              )
            : undefined,
          req.body?.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? questionParagraph("What was your job in the military?")
            : undefined,
          req.body?.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? answerParagraph(`${req.body?.militaryHistoryValue?.militaryJob}`)
            : undefined,
          req.body?.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? questionParagraph("What was your discharge status?")
            : undefined,
          req.body?.militaryHistoryValue?.enrolledMilitary === "Yes"
            ? answerParagraph(
                `${req.body?.militaryHistoryValue?.dischargeStatus}`
              )
            : undefined,

          TitleParagraph("CURRENT DAILY ACTIVITIES"),
          questionParagraph("168. What time do you wake up on work days?"),
          answerParagraph(
            `${req.body?.currentDailyActivitiesValue?.awakenTimeWorkDays}`
          ),
          questionParagraph("169. What time do you wake up on non work days?"),
          answerParagraph(
            `${req.body?.currentDailyActivitiesValue?.awakenTimeNotWorkDays}`
          ),
          questionParagraph("170. What time do you usually go to bed?"),
          answerParagraph(`${req.body?.currentDailyActivitiesValue?.goToBed}`),
          questionParagraph("171. What time do you usually fall asleep?"),
          answerParagraph(
            `${req.body?.currentDailyActivitiesValue?.fallAsleepTime}`
          ),
          questionParagraph(
            "172. Describe all of the activities you do from the time you wake up until you go to bed at night:"
          ),
          questionParagraph("What you do from 6 a.m. to 8 a.m.:"),
          answerParagraph(`${req.body?.currentDailyActivitiesValue?.do6am}`),
          questionParagraph("What you do from 8 a.m. to 10 a.m.:"),
          answerParagraph(`${req.body?.currentDailyActivitiesValue?.do8am}`),
          questionParagraph("What you do from 10 a.m. to 12 p.m.:"),
          answerParagraph(`${req.body?.currentDailyActivitiesValue?.do10am}`),
          questionParagraph("What you do from 12 p.m. to 2 p.m.:"),
          answerParagraph(`${req.body?.currentDailyActivitiesValue?.do12pm}`),
          questionParagraph("What you do from 2 p.m. to 4 p.m.:"),
          answerParagraph(`${req.body?.currentDailyActivitiesValue?.do2pm}`),
          questionParagraph("What you do from 4 p.m. to 6 p.m.:"),
          answerParagraph(`${req.body?.currentDailyActivitiesValue?.do4pm}`),
          questionParagraph("What you do from 6 p.m. to 8 p.m.:"),
          answerParagraph(`${req.body?.currentDailyActivitiesValue?.do6pm}`),
          questionParagraph("What you do from 8 p.m. to 10 p.m.:"),
          answerParagraph(`${req.body?.currentDailyActivitiesValue?.do8pm}`),
          questionParagraph(
            "What You Do From 10 p.m. to 12 p.m. (or time to bed):"
          ),
          answerParagraph(`${req.body?.currentDailyActivitiesValue?.do10pm}`),
          questionParagraph("What you do from 12 p.m. to 6 a.m.:"),
          answerParagraph(`${req.body?.currentDailyActivitiesValue?.do12p6am}`),

          questionParagraph(
            "173. What are your leisure activities or hobbies?"
          ),
          answerParagraph(
            `${req.body?.currentDailyActivitiesValue?.leisureActivities}`
          ),
          questionParagraph("174. Do you have any trouble with the following?"),
          answerParagraph(
            objectCardType(
              req.body?.currentDailyActivitiesValue?.troubleFollowing
            )
          ),

          questionParagraph(
            "175. Activities of daily living worksheet. please put a mark in the box that describes your ability to carry out the following:"
          ),
          answerParagraph(
            objectCardType(
              req.body?.currentDailyActivitiesValue?.dailyLivingFollowing
            )
          ),
          questionParagraph(
            "176. Please rate the amount of difficulty you have with the following:"
          ),
          answerParagraph(
            objectCardType(
              req.body?.currentDailyActivitiesValue?.difficultAmount
            )
          ),
          questionParagraph(
            "177. Please list any activities not included above that you used to do but are unable to do or don't do because of your condition and explain why"
          ),
          answerParagraph(
            `${req.body?.currentDailyActivitiesValue?.anyActivitiesListBefore}`
          ),

          TitleParagraph("Developmental History"),
          questionParagraph("178. Where were you born?"),
          answerParagraph(`${req.body?.developmentalValue?.bornPlace}`),
          questionParagraph("179. Where were you primarily raised?"),
          answerParagraph(`${req.body?.developmentalValue?.primarilyRaised}`),
          questionParagraph(
            "180. Who primarlily raised you during your childhood?"
          ),
          answerParagraph(`${req.body?.developmentalValue?.raisedChilhood}`),

          req.body.developmentalValue?.raisedChilhood !== ""
            ? questionParagraph(
                "Please describe your relationship with the person who primarily raised you during your childhood:"
              )
            : undefined,

          req.body.developmentalValue?.raisedChildhood !== ""
            ? answerParagraph(
                `${req.body.developmentalValue?.describeRelationshipPerson}`
              )
            : undefined,

          questionParagraph(
            "181. How would you rate your relationship with the primary adults who raised you when you were a child?"
          ),
          answerParagraph(
            `${req.body?.developmentalValue?.relationshipPrimaryAdults}`
          ),
          questionParagraph(
            "182. How many of these siblings were you raised with?"
          ),
          answerParagraph(`${req.body?.developmentalValue?.haveSiblings}`),
          req.body?.developmentalValue?.haveSiblings === "Yes"
            ? questionParagraph("How many siblings do you have?")
            : undefined,
          req.body?.developmentalValue?.haveSiblings === "Yes"
            ? answerParagraph(`${req.body?.developmentalValue?.siblingsMany}`)
            : undefined,
          req.body?.developmentalValue?.haveSiblings === "Yes"
            ? questionParagraph(
                "How many of these siblings were you raised with?"
              )
            : undefined,
          req.body?.developmentalValue?.haveSiblings === "Yes"
            ? answerParagraph(`${req.body?.developmentalValue?.siblingsRaised}`)
            : undefined,
          req.body?.developmentalValue?.haveSiblings === "Yes"
            ? questionParagraph(
                "How is your relationship with your siblings (select all that apply)?"
              )
            : undefined,
          req.body?.developmentalValue?.haveSiblings === "Yes"
            ? answerParagraph(
                `${req.body?.developmentalValue?.relationshipSiblings}`
              )
            : undefined,

          questionParagraph(
            "183. Did you experience any abuse during your childhood?"
          ),
          answerParagraph(
            `${req.body?.developmentalValue?.experienceAbuseChildhood}`
          ),
          questionParagraph("184. Were your parents ever married?"),
          answerParagraph(`${req.body?.developmentalValue?.parentsMarried}`),
          req.body?.developmentalValue?.parentsMarried === "Yes"
            ? questionParagraph("Did your parents remain married?")
            : undefined,
          req.body?.developmentalValue?.parentsMarried === "Yes"
            ? answerParagraph(
                `${req.body?.developmentalValue?.parentsRemainMarried}`
              )
            : undefined,
          req.body?.developmentalValue?.parentsMarried === "No"
            ? questionParagraph(
                "Did your parents divorce, separate, or have another arrangment?"
              )
            : undefined,
          req.body?.developmentalValue?.parentsMarried === "No"
            ? answerParagraph(`${req.body?.developmentalValue?.parentsDivorce}`)
            : undefined,
          req.body?.developmentalValue?.parentsMarried === "No"
            ? questionParagraph(
                "How old were you when your parents divorced or separated?"
              )
            : undefined,
          req.body?.developmentalValue?.parentsMarried === "No"
            ? answerParagraph(
                `${req.body?.developmentalValue?.yourOldParentsDivorced}`
              )
            : undefined,

          questionParagraph("185. Did your mother work?"),
          answerParagraph(`${req.body?.developmentalValue?.motherWork}`),
          req.body?.developmentalValue?.motherWork === "Yes"
            ? questionParagraph("What was her job?")
            : undefined,
          req.body?.developmentalValue?.motherWork === "Yes"
            ? answerParagraph(`${req.body?.developmentalValue?.motherJob}`)
            : undefined,
          req.body?.developmentalValue?.motherWork === "Yes"
            ? questionParagraph("Does your mother still work?")
            : undefined,
          req.body?.developmentalValue?.motherWork === "Yes"
            ? answerParagraph(
                `${req.body?.developmentalValue?.motherStillWork}`
              )
            : undefined,

          questionParagraph("186. Is your mother current living?"),
          answerParagraph(`${req.body?.developmentalValue?.bornPlace}`),
          req.body?.developmentalValue?.motherCurrentLiving === "No"
            ? questionParagraph("How old was she when she died?")
            : undefined,
          req.body?.developmentalValue?.motherCurrentLiving === "No"
            ? answerParagraph(`${req.body?.developmentalValue?.diedMotherOld}`)
            : undefined,
          req.body?.developmentalValue?.motherCurrentLiving === "No"
            ? questionParagraph("What did she die from?")
            : undefined,
          req.body?.developmentalValue?.motherCurrentLiving === "No"
            ? answerParagraph(`${req.body?.developmentalValue?.whatDiedMother}`)
            : undefined,

          questionParagraph("187. Did your father work?"),
          answerParagraph(`${req.body?.developmentalValue?.fatherWork}`),
          req.body?.developmentalValue?.fatherWork === "Yes"
            ? questionParagraph("What was his job?")
            : undefined,
          req.body?.developmentalValue?.fatherWork === "Yes"
            ? answerParagraph(`${req.body?.developmentalValue?.fatherJob}`)
            : undefined,
          req.body?.developmentalValue?.motherWork === "Yes"
            ? questionParagraph("Does your father still work?")
            : undefined,
          req.body?.developmentalValue?.motherWork === "Yes"
            ? answerParagraph(
                `${req.body?.developmentalValue?.fatherStillWork}`
              )
            : undefined,

          questionParagraph("188. Is your father current living?"),
          answerParagraph(
            `${req.body?.developmentalValue?.fatherCurrentLiving}`
          ),
          req.body?.developmentalValue?.fatherCurrentLiving === "No"
            ? questionParagraph("How old was he when she died?")
            : undefined,
          req.body?.developmentalValue?.fatherCurrentLiving === "No"
            ? answerParagraph(`${req.body?.developmentalValue?.diedFatherOld}`)
            : undefined,
          req.body?.developmentalValue?.fatherCurrentLiving === "No"
            ? questionParagraph("What did he die from?")
            : undefined,
          req.body?.developmentalValue?.fatherCurrentLiving === "No"
            ? answerParagraph(`${req.body?.developmentalValue?.whatDiedFather}`)
            : undefined,

          questionParagraph(
            "189. Which of these statements best describes your social life as a child:"
          ),
          answerParagraph(
            `${req.body?.developmentalValue?.bestDescribesSocialLifeChild}`
          ),

          questionParagraph(
            "190. What activities did you enjoy during your childhood?"
          ),
          answerParagraph(
            `${req.body?.developmentalValue?.enjoyActivitiesChild}`
          ),

          TitleParagraph("Additional Information"),
          questionParagraph(
            "191. Is there anything else you would like to share with the evaluating clinician before your visit begins?"
          ),
          answerParagraph(`${req.body?.additionalValue?.evaluatingClinician}`),
          questionParagraph(
            "192. Please provide any other additional information not already covered above"
          ),
          answerParagraph(
            `${req.body?.additionalValue?.yourAdditionalInformation}`
          ),
        ],
      },
    ],
  });

  const storyDoc = new Document({
    sections: [
      {
        children: [
          TitleStoryParagraph("Psychiatric History Form"),
          TitleStoryParagraph("Demographic Information"),
          storyParagraph(""),
          new Paragraph({
            children: [
              ...createTextRuns([
                `${req.body?.demographicInformation?.firstName} ${
                  req.body?.demographicInformation?.lastName
                } is a ${formatAge(
                  req.body?.demographicInformation?.birth
                )}-year-old,`,
              ]),
              ...createTextLowerRuns([
                `${req.body?.demographicInformation?.maritalStatusItems}, ${req.body?.demographicInformation?.checkedEthnicityItems}, `,
              ]),
              ...createTextLowerRuns([
                `${req.body?.demographicInformation?.radioSexItem}. `,
              ]),
            ],
          }),

          storyParagraph(
            `who goes by a preferred pronoun of ${req.body?.demographicInformation?.radioPreferPronounItem}. `
          ),

          storyParagraph(`${req.body?.demographicInformation?.email}`),
          storyParagraph(`${req.body?.demographicInformation?.phoneNumber}`),

          TitleStoryParagraph(
            `Employment Where the Physical or Emotional Injury Occurred`
          ),

          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `At the time of his injury, ${surname}${req.body?.demographicInformation?.lastName} worked for ${req.body?.employmentInjuryPhysicalValue?.currentEmployerName}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} described this business as ${req.body?.employmentInjuryPhysicalValue?.businessNature}. `,
              ]),
              ...createTextRuns([
                `${pronoun} first day of work there was ${req.body?.employmentInjuryPhysicalValue?.jobBeganDate}. `,
              ]),
              ...createTextRuns([
                `The most recent day ${pronounPrefer} worked at this job was ${req.body?.employmentInjuryPhysicalValue?.jobLastDate}. `,
              ]),
              ...createTextRuns([
                `${pronoun} job title when ${pronounPrefer} started this employment was as a ${req.body?.employmentInjuryPhysicalValue?.startedJobTitle}. `,
              ]),
              ...createTextRuns([
                `${pronoun} most recent job title at this employment was ${req.body?.employmentInjuryPhysicalValue?.currentTitle}. `,
              ]),
              ...createTextRuns([
                `${pronoun} employment duties included the following: ${req.body?.employmentInjuryPhysicalValue?.employmentDuty}. `,
              ]),
              ...createTextRuns([
                `${pronoun} typical work schedule was ${req.body?.employmentInjuryPhysicalValue?.typicalWorkSchedule}. `,
              ]),
              ...createTextRuns([
                `${pronoun} salary at this position is ${req.body?.employmentInjuryPhysicalValue?.salary}. `,
              ]),
              ...createTextRuns([
                `${pronoun} hourly rate is ${req.body?.employmentInjuryPhysicalValue?.hourlyRate}. `,
              ]),
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue?.receiveOvertimePay
              )
                ? createTextRuns([
                    `${pronounPrefer} does receive overtime pay consisting of ${req.body?.employmentInjuryPhysicalValue?.overtimeRate}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} does not receive overtime pay ${req.body?.employmentInjuryPhysicalValue?.overtimeRate}. `,
                  ])),
              ...createTextRuns([
                `${pronounPrefer} stated that ${pronounPrefer} likes his job because of ${req.body?.employmentInjuryPhysicalValue?.likeJob}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} stated that ${pronounPrefer} does not like this job due to ${req.body?.employmentInjuryPhysicalValue?.notLikeJob}. `,
              ]),
            ],
          }),

          storyParagraph(""),
          new Paragraph({
            children: [
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue
                  .radioPhysicalConditionBeforeInjuryItem
              )
                ? createTextRuns([
                    `Prior to the injury, ${surname}${req.body?.demographicInformation?.lastName} was treated for physical or medical condition(s). `,
                  ])
                : createTextRuns([
                    `Prior to the injury, ${surname}${req.body?.demographicInformation?.lastName} was not treated for any physical or medical condition(s). `,
                  ])),
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue
                  .radioMentalConditionBeforeInjuryItem
              )
                ? createTextRuns([
                    `Before the injury, ${pronounPrefer} was being treated for any mental or emotional condition(s). `,
                  ])
                : createTextRuns([
                    `Before the injury, ${pronounPrefer} was not being treated for any mental or emotional condition(s). `,
                  ])),

              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue
                  .radioEmotionalSymptomsBeforeInjuryItem
              )
                ? createTextRuns([
                    `Before the injury, ${pronounPrefer} was experiencing any emotional symptoms. `,
                  ])
                : createTextRuns([
                    `Before the injury, ${pronounPrefer} was not experiencing any emotional symptoms. `,
                  ])),

              ...createTextRuns([
                `${pronounPrefer} described these medical or emotional conditions or symptoms before the injury as follows: ${req.body.employmentInjuryPhysicalValue?.describeMedicalCondition}. `,
              ]),
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue
                  ?.radioMedicationsBeforeInjuryItem
              )
                ? createTextRuns([
                    `${pronounPrefer} was taking medications before ${pronoun} injury. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} was not taking medications before ${pronoun} injury. `,
                  ])),

              ...(req.body.employmentInjuryPhysicalValue
                ?.radioMedicationsNameBeforeInjuryItem
                ? createTextRuns([
                    `The medications ${pronounPrefer} was taking before the injury were the following: ${req.body?.employmentInjuryPhysicalValue?.radioMedicationsNameBeforeInjuryItem}. `,
                  ])
                : []),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName}'s injury occurred on the following date: ${req.body.employmentInjuryPhysicalValue?.injuryDate}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} described ${pronoun} injury as follows: ${req.body.employmentInjuryPhysicalValue.describeInjuryOccurred}. `,
              ]),
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue
                  .radioDisabilityConnectionClaimItem
              )
                ? createTextRuns([
                    `${pronounPrefer} is currently receiving disability in connection with ${pronoun} claim. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} is not currently receiving disability in connection With ${pronoun} claim. `,
                  ])),

              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue
                  .radioDisabilityConnectionClaimItem
              )
                ? createTextRuns([
                    `${pronounPrefer} currently receives disability consisting of ${req.body?.employmentInjuryPhysicalValue?.currentDisability}. `,
                  ])
                : []),
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue
                  ?.radioContinuedWorkingItem
              )
                ? createTextRuns([
                    `${pronounPrefer} stated that ${pronounPrefer} would have continued working if injured. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} stated that ${pronounPrefer} would not have continued working if not injured. `,
                  ])),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue?.radioConflictsItem
              )
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} reported that ${pronounPrefer} has had conflicts with other people at his work. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} reported that ${pronounPrefer} has not had conflicts with other people at his work. `,
                  ])),
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue?.radioConflictsItem
              )
                ? createTextRuns([
                    `In total, ${pronounPrefer} estimated that ${pronounPrefer} has ${req.body?.employmentInjuryPhysicalValue?.conflictsCount} separate conflicts with others at work. `,
                  ])
                : []),
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue?.radioConflictsItem
              )
                ? createTextRuns([
                    `${pronounPrefer} described these conflicts as follows: ${req.body?.employmentInjuryPhysicalValue?.eachConflicts}. `,
                  ])
                : []),
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue?.radioConflictsItem
              )
                ? createTextRuns([
                    `${pronounPrefer} rated the percentage that each of these conflicts caused ${prepositionPronoun} to feel upset as follows: ${req.body?.employmentInjuryPhysicalValue?.conflictsRate}. `,
                  ])
                : []),

              ...createTextRuns([
                `${pronounPrefer} described ${pronoun} working relationship with management or ${pronoun} supervisors as ${req.body?.employmentInjuryPhysicalValue?.relationShipLikeManagement}. `,
              ]),
              ...createTextRuns([
                `${pronoun} immediate supervisor was ${req.body?.employmentInjuryPhysicalValue?.immediateSupervisorName}, `,
              ]),
              ...(req.body?.employmentInjuryPhysicalValue
                ?.relationshipImmediateSupervisor === "poor"
                ? createTextLowerRuns([
                    `and ${pronounPrefer} described their relationship as ${req.body?.employmentInjuryPhysicalValue?.relationshipImmediateSupervisor}, `,
                  ])
                : createTextLowerRuns([
                    `and ${pronounPrefer} described their relationship as ${req.body?.employmentInjuryPhysicalValue?.relationshipImmediateSupervisor}. `,
                  ])),
              ...(req.body?.employmentInjuryPhysicalValue
                ?.relationshipImmediateSupervisor === "poor"
                ? createTextLowerRuns([
                    `due to ${req.body?.employmentInjuryPhysicalValue?.explainSuperVisorReason}. `,
                  ])
                : []),
              ...(req.body?.employmentInjuryPhysicalValue
                .performanceAppraisals === "poor"
                ? createTextRuns([
                    `${pronoun} performance appraisals were ${req.body?.employmentInjuryPhysicalValue?.performanceAppraisals}, `,
                  ])
                : createTextRuns([
                    `${pronoun} performance appraisals were ${req.body?.employmentInjuryPhysicalValue?.performanceAppraisals}. `,
                  ])),
              ...(req.body?.employmentInjuryPhysicalValue
                ?.performanceAppraisals === "poor"
                ? createTextRuns([
                    `due to ${req.body?.employmentInjuryPhysicalValue?.explainPerformanceAppraisals}. `,
                  ])
                : []),

              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue?.verbalWarning
              )
                ? createTextRuns([
                    `${pronounPrefer} has received verbal or written warnings, `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has not received any verbal or written warnings. `,
                  ])),
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue?.verbalWarning
              )
                ? createTextLowerRuns([
                    `consisting of ${req.body?.employmentInjuryPhysicalValue?.verbalWarningDateReason}. `,
                  ])
                : []),
              ...(req.body?.employmentInjuryPhysicalValue
                ?.relationshipCoWorkers === "poor"
                ? createTextRuns([
                    `${pronounPrefer} described ${pronoun} working relationship with ${pronoun} coworkers as ${req.body?.employmentInjuryPhysicalValue?.relationshipCoWorkers}, `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} described ${pronoun} working relationship with ${pronoun} coworkers as ${req.body?.employmentInjuryPhysicalValue?.relationshipCoWorkers}. `,
                  ])),
              ...(req.body?.employmentInjuryPhysicalValue
                ?.relationshipCoWorkers === "poor"
                ? createTextLowerRuns([
                    `due to ${req.body?.employmentInjuryPhysicalValue?.explainRelationshipCoWorkers}. `,
                  ])
                : []),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue?.lastStraw
              )
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} stated that there was a "Last Straw" event near the last day of work. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} stated that there was not a "Last Straw" event near the last day of work. `,
                  ])),
              ...(validateBoolean(
                req.body?.employmentInjuryPhysicalValue?.lastStraw
              )
                ? createTextLowerRuns([
                    `consisting of ${req.body?.employmentInjuryPhysicalValue?.explainLastStraw}.`,
                  ])
                : []),
            ],
          }),
          storyParagraph(""),

          TitleStoryParagraph("Current Employer (If Different Than Above)"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(validateBoolean(
                req.body?.currentEmployerValue?.currentlyWorkEmployerInjury
              )
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} currently works for the same employer where the above injury occurred. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} currently does not work for the same employer where the above injury occurred. `,
                  ])),

              ...(!validateBoolean(
                req.body?.currentEmployerValue?.currentlyWorkEmployerInjury
              )
                ? createTextRuns([
                    `Currently, ${pronounPrefer} works for ${req.body?.currentEmployerValue?.currentlyWorkEmployerName}. `,
                  ])
                : []),
              ...(!validateBoolean(
                req.body?.currentEmployerValue?.currentlyWorkEmployerInjury
              )
                ? createTextRuns([
                    `${pronounPrefer} described this business as ${req.body?.currentEmployerValue?.currentlyWorkNatureBusiness}. `,
                  ])
                : []),
              ...(!validateBoolean(
                req.body?.currentEmployerValue?.currentlyWorkEmployerInjury
              )
                ? createTextRuns([
                    `${pronoun} job title at this employment is ${req.body?.currentEmployerValue?.currentlyWorkJobTitle}. `,
                  ])
                : []),
              ...(!validateBoolean(
                req.body?.currentEmployerValue?.currentlyWorkEmployerInjury
              )
                ? createTextRuns([
                    `${pronoun} employment duties include the following: ${req.body?.currentEmployerValue?.currentlyWorkJobDuties}. `,
                  ])
                : []),
              ...(!validateBoolean(
                req.body?.currentEmployerValue?.currentlyWorkEmployerInjury
              )
                ? createTextRuns([
                    `${pronoun} first day of work there was ${req.body?.currentEmployerValue?.currentlyWorkJobBeganDate}. `,
                  ])
                : []),
              ...(!validateBoolean(
                req.body?.currentEmployerValue?.currentlyWorkEmployerInjury
              )
                ? createTextRuns([
                    `${pronoun} typical work schedule is ${req.body?.currentEmployerValue?.currentlyWorkSchedule}. `,
                  ])
                : []),
              ...(!validateBoolean(
                req.body?.currentEmployerValue?.currentlyWorkEmployerInjury
              )
                ? createTextRuns([
                    `${pronoun} pay rate is ${req.body?.currentEmployerValue?.currentlyWorkSalary}. `,
                  ])
                : []),
              ...(!validateBoolean(
                req.body?.currentEmployerValue?.currentlyWorkEmployerInjury
              ) &&
              validateBoolean(
                req.body?.currentEmployerValue?.currentlyWorkLikeThisJob
              )
                ? createTextRuns([`${pronounPrefer} enjoys this job.`])
                : createTextRuns([
                    `${pronounPrefer} does not enjoy this job.`,
                  ])),
            ],
          }),
          storyParagraph(""),

          TitleStoryParagraph("Physical Injury"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName} reported that ${pronoun} injury was in part or entirely physical. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} stated that the first symptoms that ${pronounPrefer} experienced were ${req.body?.physicalInjuryValue?.firstSymptoms}. `,
              ]),
              ...createTextRuns([
                `Following this injury, the first treatment that ${pronounPrefer} received was ${req.body?.physicalInjuryValue?.firstTreatment}. `,
              ]),
              ...createTextRuns([
                `The remainder of ${pronoun} treatment has consisted of the following: ${req.body?.physicalInjuryValue?.restYourTreatment}. `,
              ]),
              ...createTextRuns([
                `The doctors ${pronounPrefer} has seen for this physical injury are ${req.body?.physicalInjuryValue?.doctorsList}. `,
              ]),
              ...(validateBoolean(
                req.body?.physicalInjuryValue?.receivedSurgery
              )
                ? createTextRuns([
                    `${pronounPrefer} received surgery for this injury. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} did not receive surgery for this injury. `,
                  ])),
              ...createTextRuns([
                `${pronoun} surgeries consisted of ${req.body?.physicalInjuryValue?.surgeryList}. `,
              ]),
              ...createTextRuns([
                `The medications ${pronounPrefer} received for this physical injury include: ${req.body?.physicalInjuryValue?.medicationList}. `,
              ]),
              ...(validateBoolean(
                req.body?.physicalInjuryValue?.treatmentsHelped
              )
                ? createTextRuns([
                    `${pronounPrefer} reported that the above treatments have helped relieve ${pronoun} pain. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} reported that the above treatments have not helped relieve ${pronoun} pain. `,
                  ])),
              ...(validateBoolean(req.body?.physicalInjuryValue?.stillWorking)
                ? createTextRuns([`${pronounPrefer} is currently working. `])
                : createTextRuns([
                    `${pronounPrefer} is not currently working. `,
                  ]),
              createTextRuns([
                `${pronounPrefer} explained that ${pronounPrefer} is not working due to ${req.body?.physicalInjuryValue?.leavingReason}. `,
              ])),
            ],
          }),
          storyParagraph(""),

          TitleStoryParagraph("Emotional Symptoms and Injuries"),
          storyParagraph(""),

          storyParagraph(
            `${surname}${req.body?.demographicInformation?.lastName} reported that ${pronounPrefer} is most bothered on this day by the following: ${req.body?.chiefComplaintValue?.mostBothered}. `
          ),
          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${
                  req.body?.demographicInformation?.lastName
                } reported that ${pronounPrefer} has experienced a cluster of ${divideArray(
                  req.body?.chiefComplaintValue?.currentlyExperiencingSymptom
                )} symptoms, `,
              ]),
              ...(req.body?.chiefComplaintValue
                ?.currentlyExperiencingSymptom !== "" &&
              req.body?.chiefComplaintValue?.currentlyExperiencingSymptom !==
                "none of the above"
                ? createTextLowerRuns([
                    `that began ${req.body?.chiefComplaintValue?.currentEpisodeDate}. `,
                  ])
                : []),

              ...(validateBoolean(
                req.body?.chiefComplaintValue?.specificStressfulSymptom
              )
                ? createTextRuns([
                    `${pronounPrefer} has experienced these psychiatric symptoms in response to a specific stressful event. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has not experienced these psychiatric symptoms in response to a specific stressful event. `,
                  ])),
              ...(validateBoolean(
                req.body?.chiefComplaintValue?.specificStressfulSymptom
              )
                ? createTextRuns([
                    `${pronounPrefer} reported that this trigger consisted of ${req.body?.chiefComplaintValue?.specificStressfulEvent}. `,
                  ])
                : []),
              ...createTextRuns([
                `${pronounPrefer} reported a history of psychosocial stressors consisting of ${divideArray(
                  req.body?.chiefComplaintValue?.stressFollowing
                )}. `,
              ]),
            ],
          }),

          storyParagraph(""),
          TitleStoryParagraph("Longitudinal History"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName} reported that this episode of depression, anxiety, or post-trauma emotions started on ${req.body?.longitudinalHistoryValue?.emotionEpisodeBegan}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} described ${pronoun} symptoms as follows: ${req.body?.longitudinalHistoryValue?.emotionSymptom}. `,
              ]),
              ...createTextRuns([
                `During this current or most recent symptom episode, ${pronoun} symptoms were the worst in ${req.body?.longitudinalHistoryValue?.mostWorstSymptom}. `,
              ]),
              ...createTextRuns([
                `${pronoun} emotional symptoms became ${req.body.longitudinalHistoryValue?.emotionalSymptomBecome} since ${req.body?.longitudinalHistoryValue?.emotionalSymptomDate}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} experiences the above emotions ${req.body?.longitudinalHistoryValue?.feelEmotion}.`,
              ]),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName} rated ${pronoun} depressive symptoms as a ${req.body?.longitudinalHistoryValue?.depressiveSymptom} out of 10, when they were most severe, on a scale of 1 to 10, with 0-1 equaling minimal or no symptoms and 10 equaling the most severe symptoms imaginable. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} rated ${pronoun} anxiety symptoms as a ${req.body?.longitudinalHistoryValue?.anxietySymptom} out of 10, when they were most severe, on a scale of 1 to 10, with 0-1 equaling minimal or no symptoms and 10 equaling the most severe symptoms imaginable. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} rated ${pronoun} post-trauma symptoms as a ${req.body?.longitudinalHistoryValue?.postTraumaSymptom} out of 10, when they were most severe, on a scale of 1 to 10, with 0-1 equaling minimal or no symptoms and 10 equaling the most severe symptoms imaginable. `,
              ]),
              ...createTextRuns([
                `Currently, ${pronounPrefer} rates ${pronoun} depressive, anxiety, or post-trauma symptoms as a ${req.body?.longitudinalHistoryValue?.compareEmotionalSymptom} out of 10. `,
              ]),
              ...(validateBoolean(
                req.body?.longitudinalHistoryValue?.symptomsAffectedJob
              )
                ? createTextRuns([
                    `${pronounPrefer} reported that ${pronoun} emotional symptoms have affected ${pronoun} ability to do ${pronoun} job. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} reported that ${pronoun} emotional symptoms have never affected ${pronoun} ability to do ${pronoun} job. `,
                  ])),
              ...(validateBoolean(
                req.body?.longitudinalHistoryValue?.symptomsAffectedJob
              )
                ? createTextRuns([
                    `${pronounPrefer} explained this effect as: ${req.body?.longitudinalHistoryValue?.describeSymptomsAffectedJob}. `,
                  ])
                : []),
            ],
          }),
          storyParagraph(""),

          TitleStoryParagraph("Current Symptoms"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName} reported that ${pronoun} current depressive symptoms over the last 2 weeks consist of the following: `,
              ]),
              ...(req.body?.PHQValue?.interestThing !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} has retained the ability to enjoy activities that were previously enjoyable for ${req.body.PHQValue?.interestThing}, `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has lost the ability to enjoy activities that were previously enjoyable. `,
                  ])),
              ...(req.body?.PHQValue?.interestThing !== "not at all"
                ? createTextLowerRuns([
                    `such as ${req.body?.PHQValue?.previouslyEnjoyable}. `,
                  ])
                : []),
              ...createTextRuns([
                `${pronounPrefer} has experienced depressed mood occurring ${req.body?.PHQValue?.feelingDepressed} per week. `,
              ]),
              ...(req.body?.PHQValue?.feelingDepressed !== "not at all"
                ? createTextRuns([
                    `${pronoun} depressive symptoms have ${req.body?.PHQValue?.depressiveSymptomsImproved} since they started. `,
                  ])
                : []),
              ...(req.body?.PHQValue?.feelingDepressed !== "not at all"
                ? createTextRuns([
                    `${pronoun} depressive symptoms occur ${req.body?.PHQValue?.oftenFeelDepressed} `,
                  ])
                : []),
              ...(req.body?.PHQValue?.feelingDepressed !== "not at all" &&
              req.body?.PHQValue?.PHQValue?.experienceDepression === "Yes"
                ? createTextLowerRuns([`for a majority of the time each day. `])
                : createTextLowerRuns([
                    `for a minority of the time each day. `,
                  ])),

              ...(req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} has trouble falling asleep, staying asleep or sleeping too much ${req.body?.PHQValue?.troubleFallingAsleep} per week. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} does not have trouble falling asleep, staying asleep or sleeping too much ${req.body?.PHQValue?.troubleFallingAsleep} per week. `,
                  ])),
              ...(req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} falls asleep after ${req.body?.PHQValue?.fallASleep} of ${pronoun} going to bed. `,
                  ])
                : []),
              ...(req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} wakes up ${req.body?.PHQValue?.wakeUpTimes} times per night. `,
                  ])
                : []),
              ...(req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
                ? createTextRuns([
                    `When ${pronounPrefer} wakes up during the night, ${pronounPrefer} stays awake for ${req.body?.PHQValue?.stayAwakeLong}. `,
                  ])
                : []),
              ...(req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} is awoken by ${req.body?.PHQValue?.awakeSleepReason}. `,
                  ])
                : []),
              ...(req.body?.PHQValue?.troubleFallingAsleep !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} sleeps ${req.body?.PHQValue?.totalSleepTimes} per 24 hours. `,
                  ])
                : []),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.PHQValue?.feelingEnergy !== "not at all"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} feels tired or having little energy ${req.body?.PHQValue?.feelingEnergy} during the week. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} does not feel tired or having little energy ${req.body?.PHQValue?.feelingEnergy} during the week. `,
                  ])),
              ...(req.body?.PHQValue?.poorAppetite !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} has experienced poor appetite or overeating ${req.body?.PHQValue?.poorAppetite} during the week. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has not experienced poor appetite or overeating ${req.body?.PHQValue?.poorAppetite} during the week. `,
                  ])),
              ...(req.body?.PHQValue?.poorAppetite !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} has ${req.body?.PHQValue?.recentlyWeightPounds} pounds. `,
                  ])
                : []),
              ...(req.body?.PHQValue?.poorAppetite !== "not at all"
                ? createTextLowerRuns([
                    `in the last ${req.body?.PHQValue?.weightGainLostLong}. `,
                  ])
                : []),

              ...(req.body?.PHQValue?.yourselfFeelingBad !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} reported feeling bad about ${manPronoun} or that ${pronounPrefer} is a failure or has let ${manPronoun} or ${pronoun} family down ${req.body?.PHQValue?.yourselfFeelingBad}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied feeling bad about ${manPronoun} or that ${pronounPrefer} is a failure or has let ${manPronoun} or ${pronoun} family down ${req.body?.PHQValue?.yourselfFeelingBad}. `,
                  ])),
              ...(req.body?.PHQValue?.troubleConCentratingThing !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} reported trouble concentrating ${req.body?.PHQValue?.troubleConCentratingThing} in the last two weeks. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied trouble concentrating ${req.body?.PHQValue?.troubleConCentratingThing} in the last two weeks. `,
                  ])),
              ...(req.body?.PHQValue?.fidgetyMoving !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} reported moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that ${pronounPrefer} has to move a lot more than usual ${req.body?.PHQValue?.fidgetyMoving}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that ${pronounPrefer} has to move a lot more than usual ${req.body?.PHQValue?.fidgetyMoving}. `,
                  ])),
              ...(req.body?.PHQValue?.betterOffDeadYourself !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} reported thinking ${pronounPrefer} would be better off dead or had thoughts of hurting ${manPronoun} ${req.body?.PHQValue?.betterOffDeadYourself}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied thinking ${pronounPrefer} would be better off dead or had thoughts of hurting ${manPronoun} ${req.body?.PHQValue?.betterOffDeadYourself}. `,
                  ])),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${
                  req.body?.demographicInformation?.lastName
                }'s PHQ-9 score was in the ${ScoreCalculate(
                  req.body?.PHQValue?.phqScore
                )} range:${req.body.PHQValue?.phqScore}. `,
              ]),
              ...(req.body?.PHQValue?.deadWishWakeUp !== "not at all"
                ? createTextRuns([
                    `In the past month, ${pronounPrefer} has wished ${pronounPrefer} was dead or wished ${pronounPrefer} could go to sleep and not wake up ${req.body?.PHQValue?.deadWishWakeUp}. `,
                  ])
                : createTextRuns([
                    `In the past month, ${pronounPrefer} has not wished ${pronounPrefer} was dead or wished ${pronounPrefer} could go to sleep and not wake up ${req.body?.PHQValue?.deadWishWakeUp}. `,
                  ])),
              ...(req.body?.PHQValue?.killingYourself === "Yes"
                ? createTextRuns([
                    `In the past month, ${pronounPrefer} has had actual thoughts of killing ${manPronoun}. `,
                  ])
                : req.body?.PHQValue?.killingYourself === "No"
                ? createTextRuns([
                    `In the past month, ${pronounPrefer} has not had any actual thoughts of killing ${manPronoun}. `,
                  ])
                : createTextRuns([
                    `In the past month, ${pronounPrefer} is not sure if ${pronounPrefer} had any actual thoughts of killing ${manPronoun}. `,
                  ])),

              ...(req.body?.PHQValue?.killingYourself !== "No" &&
              req.body?.PHQValue?.killMethod === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has been thinking about how ${pronounPrefer} might kill ${manPronoun}. `,
                  ])
                : req.body?.PHQValue?.killingYourself !== "No" &&
                  req.body?.PHQValue?.killMethod === "No"
                ? createTextRuns([
                    `${pronounPrefer} has not been thinking about how ${pronounPrefer} might kill ${manPronoun}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} is not sure if ${pronounPrefer} has been thinking about how ${pronounPrefer} might kill ${manPronoun}. `,
                  ])),

              ...(req.body?.PHQValue?.killingYourself !== "No" &&
              req.body?.PHQValue?.killMethod !== "No" &&
              req.body?.PHQValue?.actingIntention === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has had these thoughts, and had some intention of acting on them. `,
                  ])
                : req.body?.PHQValue?.killingYourself !== "No" &&
                  req.body?.PHQValue?.killMethod !== "No" &&
                  req.body?.PHQValue?.actingIntention === "No"
                ? createTextRuns([
                    `${pronounPrefer} has not had these thoughts, and had some intention of acting on them. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} is not sure if ${pronounPrefer} had these thoughts, and had some intention of acting on them. `,
                  ])),

              ...(req.body?.PHQValue?.killingYourself !== "No"
                ? req.body?.PHQValue?.killMethod !== "No"
                  ? req.body?.PHQValue?.actingIntention !== "No"
                    ? req.body?.PHQValue?.killIntentionCarryout === "Yes"
                      ? createTextRuns([
                          `${pronounPrefer} has started to work out the details of how to kill ${manPronoun}. `,
                        ])
                      : req.body?.PHQValue?.killingYourself !== "No"
                      ? req.body?.PHQValue?.killMethod !== "No"
                        ? req.body?.PHQValue?.actingIntention !== "No"
                          ? req.body?.PHQValue?.killIntentionCarryout === "No"
                            ? createTextRuns([
                                `${pronounPrefer} has not started to work out the details of how to kill ${manPronoun}. `,
                              ])
                            : createTextRuns([
                                `${pronounPrefer} is not sure if ${pronounPrefer} started to work out the details of how to kill ${manPronoun}. `,
                              ])
                          : []
                        : []
                      : []
                    : []
                  : []
                : []),

              ...(req.body?.PHQValue?.preparedAnythingEndYourlife === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} answered yes (or no) when asked if ${pronounPrefer} has ever done anything, started to do anything, or prepared to do anything to end ${pronoun} life `,
                  ])
                : req.body?.PHQValue?.preparedAnythingEndYourlife === "No"
                ? createTextRuns([
                    `${pronounPrefer} answered no when asked if ${pronounPrefer} has ever done anything, started to do anything, or prepared to do anything to end ${pronoun} life`,
                  ])
                : createTextRuns([
                    `${pronounPrefer} is not sure if ${pronounPrefer} has ever done anything, started to do anything, or prepared to do anything to end ${pronoun} life. `,
                  ])),

              ...(req.body?.PHQValue?.hurtingAnyone === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has had thoughts of hurting someone else. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has not had thoughts of hurting someone else. `,
                  ])),
              ...createTextRuns([
                `${pronounPrefer} rated his current depressive symptoms as a ${req.body?.PHQValue?.currentDepressiveSymptoms} out of 10, on a scale of 1 to 10, with 0-1 equaling minimal or no depression and 10 equaling the most severe depressive symptoms imaginable. `,
              ]),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `Over the last 2 weeks, ${surname}${req.body?.demographicInformation?.lastName} reported experiencing anxiety symptoms for ${req.body?.GADValue?.feelingNervous}. `,
              ]),
              ...(req.body?.GADValue?.feelingNervous !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} has felt anxious during this most recent episode for ${req.body?.GADValue?.feltAnxiousLong}, `,
                  ])
                : []),
              ...(req.body?.GADValue?.feelingNervous !== "not at all"
                ? createTextLowerRuns([
                    `with anxious mood on ${req.body?.GADValue?.feelAnxiousOften}. `,
                  ])
                : []),

              ...(req.body?.GADValue?.stopControlWorring !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} reported being unable to stop or control worrying for ${req.body?.GADValue?.stopControlWorring} in the last two weeks. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denies being unable to stop or control worrying ${req.body?.GADValue?.stopControlWorring}. `,
                  ])),
              ...(req.body?.GADValue?.worringDifferentThing !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} reported worrying too much about different things `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denies worrying too much about different things. `,
                  ])),
              ...(req.body?.GADValue?.worringDifferentThing !== "not at all"
                ? createTextLowerRuns([
                    `regarding ${pronoun} ${divideArray(
                      req.body?.GADValue?.worringThing
                    )}. `,
                  ])
                : []),
              ...(req.body?.GADValue?.worringDifferentThing !== "not at all"
                ? createTextLowerRuns([
                    `${pronounPrefer} reported the following triggers make his anxiety worse:${req.body?.GADValue?.specificAnxietyWorse}. `,
                  ])
                : createTextLowerRuns([
                    `${pronounPrefer} denied that any specific triggers make his anxiety worse. `,
                  ])),
              ...(req.body?.GADValue?.troubleRelaxing !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} reported trouble relaxing ${req.body?.GADValue?.troubleRelaxing}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denies trouble relaxing ${req.body?.GADValue?.troubleRelaxing}. `,
                  ])),
              ...(req.body?.GADValue?.restlessSitHard !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} reported being so restless that it's hard to sit still on ${req.body?.GADValue?.restlessSitHard}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denies being so restless that it's hard to sit still `,
                  ])),
              ...(req.body?.GADValue?.easilyAnnoyed !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} reported feeling afraid as if something awful might happen ${req.body?.GADValue?.easilyAnnoyed}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denies feeling afraid as if something awful might happen ${req.body?.GADValue?.easilyAnnoyed}. `,
                  ])),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${
                  req.body?.demographicInformation?.lastName
                }'s GAD-7 score was in the ${ScoreCalculate(
                  req.body?.GADValue?.gadScore
                )} range:${req.body.GADValue?.gadScore}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} rated his current anxiety symptoms as a ${req.body?.GADValue?.currentAnxietySymptoms} out of 10, on a scale of 1 to 10, with 0-1 equaling minimal or no anxiety and 10 equaling the most severe anxiety symptoms imaginable. `,
              ]),
              ...(req.body?.GADValue?.panicAttacks === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} also has experienced panic attacks consisting of `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} also has not experienced panic attacks.`,
                  ])),
              ...(req.body?.GADValue?.panicAttacks === "Yes"
                ? createTextLowerRuns([
                    `${divideArray(
                      req.body?.GADValue?.panicPhysicalSymptoms
                    )} `,
                  ])
                : []),
              ...(req.body?.GADValue?.panicAttacks === "Yes"
                ? createTextRuns([
                    `lasting ${req.body?.GADValue?.panicAttacksLastLong}. `,
                  ])
                : []),
              ...(req.body?.GADValue?.panicAttacks === "Yes"
                ? req.body?.GADValue?.panicAttacksSpontaneous === "Yes"
                  ? createTextRuns([
                      `${pronoun} panic attacks are spontaneous and are unrelated to any events. `,
                    ])
                  : createTextRuns([
                      `${pronoun} panic attacks are not spontaneous and are unrelated to any events. `,
                    ])
                : []),
              ...(req.body?.GADValue?.panicAttacks === "Yes" &&
              req.body?.GADValue?.panicOccur !== ""
                ? createTextRuns([
                    `${pronoun} panic attacks occur every ${req.body?.GADValue?.panicOccur}.`,
                  ])
                : []),
              ...(req.body?.GADValue?.panicAttacks === "Yes" &&
              req.body?.GADValue?.panicAttacksList !== ""
                ? createTextRuns([
                    `${pronounPrefer} reported that ${req.body?.GADValue?.panicAttacksList} triggers ${pronoun} panic attacks. `,
                  ])
                : []),
            ],
          }),

          new Paragraph({
            children: [
              ...(req.body?.GADValue?.pastTraumaticEvents === "Yes"
                ? createTextRuns([
                    `${surname}${
                      req.body?.demographicInformation?.lastName
                    } reported experiencing traumatic events consisting of ${divideArray(
                      req.body?.GADValue?.traumaticEventExperience
                    )}`,
                  ])
                : []),
              ...(req.body?.GADValue?.pastTraumaticEvents === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} experienced past traumatic event(s) consisting of ${req.body?.GADValue?.describeTraumaticExperience}. `,
                  ])
                : []),

              ...createTextRuns([
                `${pronounPrefer} has experienced the following post trauma related symptoms. `,
              ]),
              ...(req.body?.PCLValue?.stressfulExperienceMemories !==
              "not at all"
                ? createTextRuns([
                    `${pronounPrefer} reported repeated, disturbing, and unwanted memories of the stressful experience ${req.body?.PCLValue?.stressfulExperienceMemories}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied repeated, disturbing, and unwanted memories of the stressful experience. `,
                  ])),
              ...(req.body?.PCLValue?.stressfulExperience !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed experiencing repeated, disturbing dreams of the stressful experience ${req.body?.PCLValue?.stressfulExperience}, `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied experiencing repeated, disturbing dreams of the stressful experience, `,
                  ])),
              ...(req.body?.PCLValue?.stressfulExperience !== "not at all"
                ? createTextLowerRuns([
                    `${req.body?.PCLValue?.disturbingDreamsOccur}. `,
                  ])
                : []),

              ...(req.body?.PCLValue?.suddenlyStressfulExperience !==
              "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed suddenly feeling or acting as if the stressful experience were actually happening again (as if you were actually back there reliving it) ${req.body?.PCLValue?.suddenlyStressfulExperience}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied suddenly feeling or acting as if the stressful experience were actually happening again (as if you were actually back there reliving it). `,
                  ])),
              ...(req.body?.PCLValue?.veryUpsetStressfulExperience !==
              "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed experiencing repeated, disturbing dreams of the stressful experience ${req.body?.PCLValue?.veryUpsetStressfulExperience}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied experiencing repeated, disturbing dreams of the stressful experience. `,
                  ])),
              ...(req.body?.PCLValue
                ?.strongPhysicalReactionStressfulExperience !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed having strong physical reactions when something reminded ${prepositionPronoun} of the stressful experience (for example, heart pounding, trouble breathing, sweating):${req.body.PCLValue.strongPhysicalReactionStressfulExperience}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied having strong physical reactions when something reminded ${prepositionPronoun} of the stressful experience (for example, heart pounding, trouble breathing, sweating). `,
                  ])),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.PCLValue?.avoidingMemories !== "not at all"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} endorsed avoiding memories, thoughts, or feelings related to the stressful experience as ${req.body?.PCLValue?.avoidingMemories}. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName}} denied avoiding memories, thoughts, or feelings related to the stressful experience as. `,
                  ])),
              ...(req.body?.PCLValue?.avoidingExternalReminders !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed avoiding external reminders of the stressful experience (for example, people, places, conversations, activities, objects, or situations) ${req.body?.PCLValue?.avoidingExternalReminders}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied avoiding external reminders of the stressful experience (for example, people, places, conversations, activities, objects, or situations). `,
                  ])),
              ...(req.body?.PCLValue?.avoidingExternalReminders !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} reported avoiding the following: ${req.body?.PCLValue?.describeSituations}. `,
                  ])
                : []),
              ...(req.body?.PCLValue?.avoidingExternalReminders !== "not at all"
                ? createTextRuns([
                    `The activities ${pronounPrefer} avoids in relation to the trauma include ${req.body?.PCLValue?.avoidActivities}`,
                  ])
                : []),

              ...(req.body?.PCLValue?.troubleStressfulExperience !==
              "not at all"
                ? createTextRuns([
                    `${pronounPrefer} described trouble remembering important parts of the stressful experience ${req.body?.PCLValue?.troubleStressfulExperience}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} described trouble remembering important parts of the stressful experience. `,
                  ])),
              ...(req.body?.PCLValue?.strongNegativeBeliefs !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} described having strong negative beliefs about ${manPronoun}, other people, or the world (for example, having thoughts such as: I am bad, there is something seriously wrong with me), as ${req.body?.PCLValue?.strongNegativeBeliefs}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} described having strong negative beliefs about ${manPronoun}, other people, or the world (for example, having thoughts such as: I am bad, there is something seriously wrong with me). `,
                  ])),
              ...(req.body?.PCLValue?.stressfulExperienceBlaming !==
              "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed blaming ${manPronoun} or someone else for the stressful experience or what happened after it ${req.body?.PCLValue?.stressfulExperienceBlaming}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied blaming ${manPronoun} or someone else for the stressful experience or what happened after it. `,
                  ])),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.PCLValue?.strongNegativefeelings !== "not at all"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} endorsed having strong negative feelings such as fear, horror, anger, guilt, or shame as ${req.body?.PCLValue?.strongNegativefeelings}. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} denied having strong negative feelings such as fear, horror, anger, guilt, or shame as. `,
                  ])),
              ...(req.body?.PCLValue?.lossInterestActivity !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed loss of interest in activities that ${pronounPrefer} used to enjoy as ${req.body?.PCLValue?.lossInterestActivity}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied loss of interest in activities that ${pronounPrefer} used to enjoy. `,
                  ])),
              ...(req.body?.PCLValue?.feelingDistantPeople !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed experiencing feeling distant or cut off from other people ${req.body?.PCLValue?.feelingDistantPeople}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied experiencing feeling distant or cut off from other people. `,
                  ])),
              ...(req.body?.PCLValue?.troubleExperiencePositiveFeeling !==
              "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed trouble experiencing positive feelings (for example, being unable to feel happiness or have loving feelings for people close to ${manPronoun}) ${req.body?.PCLValue?.troubleExperiencePositiveFeeling}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied trouble experiencing positive feelings (for example, being unable to feel happiness or have loving feelings for people close to ${manPronoun}). `,
                  ])),
              ...(req.body?.PCLValue?.irritableBehavior !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed irritable behavior, angry outbursts, or acting aggressively as ${req.body?.PCLValue?.irritableBehavior}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied irritable behavior, angry outbursts, or acting aggressively. `,
                  ])),
              ...(req.body?.PCLValue?.manyRisksThing !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed taking too many risks or doing things that could cause you harm ${req.body?.PCLValue?.manyRisksThing}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied taking too many risks or doing things that could cause you harm. `,
                  ])),
              ...(req.body?.PCLValue?.beingWatchful !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed being “superalert” or watchful or on guard ${req.body?.PCLValue?.beingWatchful}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied being “superalert” or watchful or on guard. `,
                  ])),
              ...(req.body?.PCLValue?.easilyStartled !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed feeling jumpy or being easily startled ${req.body?.PCLValue?.easilyStartled}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied feeling jumpy or being easily startled. `,
                  ])),
              ...(req.body?.PCLValue?.difficultyConcentrating !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed having difficulty concentrating ${req.body?.PCLValue?.difficultyConcentrating}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied having difficulty concentrating. `,
                  ])),
              ...(req.body?.PCLValue?.troubleFallingAsleep !== "not at all"
                ? createTextRuns([
                    `${pronounPrefer} endorsed trouble falling or staying asleep ${req.body?.PCLValue?.troubleFallingAsleep}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied trouble falling or staying asleep. `,
                  ])),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.PCLValue?.PCLScore >= 31 &&
              req.body?.PCLValue?.PCLScore <= 33
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName}'s PCL-5 score is indicative of probable PTSD:${req.body.PCLValue.PCLScore}. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName}'s PCL-5 score is not indicative of probable PTSD:${req.body.PCLValue.PCLScore}. `,
                  ])),
              ...createTextRuns([
                `${pronounPrefer} rated ${pronoun} current post-trauma symptoms as an ${req.body?.PCLValue?.currentRelatedSymptoms} out of 10, on a scale of 1 to 10, with 0-1 equaling minimal or no post-trauma symptoms and 10 equaling the most severe post-traumatic symptoms imaginable. `,
              ]),
            ],
          }),
          storyParagraph(""),

          TitleStoryParagraph("Current Treatment"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName} currently takes psychiatric medications. `,
              ]),
              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychiatricMedications === "Yes"
                ? createTextRuns([
                    `The psychiatric medications he takes consist of the following: ${req.body?.currentTreatmentValue?.medicationList}. `,
                  ])
                : []),
              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychiatricMedications === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has taken these medications since ${req.body?.currentTreatmentValue?.medicationLong}. `,
                  ])
                : []),
              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychiatricMedications === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} stated that he takes these medications for ${divideArray(
                      req.body?.currentTreatmentValue?.medicationReason
                    )}. `,
                  ])
                : []),
              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychiatricMedications === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} stated that these medications have produced ${formatMedication(
                      req.body?.currentTreatmentValue
                        ?.medicationsEffectYourCondition
                    )}. `,
                  ])
                : []),

              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychiatricMedications === "Yes"
                ? req.body?.currentTreatmentValue?.medicationAsPrescribed ===
                  "Yes"
                  ? createTextRuns([
                      `${pronounPrefer} is currently compliant with taking ${pronoun} psychiatric medications. `,
                    ])
                  : createTextRuns([
                      `${pronounPrefer} is currently non compliant with taking ${pronoun} psychiatric medications. `,
                    ])
                : []),

              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychiatricMedications === "Yes"
                ? req.body?.currentTreatmentValue?.experiencedSideEffects !==
                  "other"
                  ? createTextRuns([
                      `${pronounPrefer} has experienced side effects consisting of ${divideArray(
                        req.body?.currentTreatmentValue?.experiencedSideEffects
                      )}. `,
                    ])
                  : createTextRuns([
                      `${pronounPrefer} has not experienced side effects. `,
                    ])
                : []),
              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychiatricMedications === "Yes"
                ? req.body?.currentTreatmentValue?.experiencedSideEffects ===
                  "other"
                  ? createTextRuns([
                      `and ${req.body?.currentTreatmentValue?.describeSideEffect}. `,
                    ])
                  : []
                : []),

              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychiatricMedications === "Yes"
                ? createTextRuns([
                    `${pronoun} most recent psychiatric medication treatment provider was ${req.body?.currentTreatmentValue?.recentTreatmentProvider}. `,
                  ])
                : []),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychotherapyTreatment === "Yes"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} reported that ${pronounPrefer} attends psychotherapy treatment. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} denied that ${pronounPrefer} attends psychotherapy treatment. `,
                  ])),
              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychotherapyTreatment === "Yes"
                ? createTextRuns([
                    `${pronoun} most recent psychotherapy began on ${req.body?.currentTreatmentValue?.recentPsychotherapyBegin} `,
                  ])
                : []),
              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychotherapyTreatment === "Yes"
                ? createTextLowerRuns([
                    `and ${pronoun} most recent psychotherapy session occurred on ${req.body?.currentTreatmentValue?.recentPsychotherapySession}. `,
                  ])
                : []),
              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychotherapyTreatment === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} attends therapy ${req.body?.currentTreatmentValue?.psychotherapySessionsDate}. `,
                  ])
                : []),
              ...(req.body?.currentTreatmentValue
                ?.currentlyPsychotherapyTreatment === "Yes"
                ? createTextRuns([
                    `${pronoun} current or most recent psychotherapist is ${req.body?.currentTreatmentValue?.psychotherapistTreatmentProvider}. `,
                  ])
                : []),
            ],
          }),
          storyParagraph(""),

          TitleStoryParagraph("Past Psychiatric History"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.pastHistoryValue?.describeSymptoms !== ""
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} reported a history of prior ${req.body?.pastHistoryValue?.previouslyExperiencedSymptom}. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} denied a history of prior ${req.body?.pastHistoryValue?.previouslyExperiencedSymptom}. `,
                  ])),

              ...(req.body?.pastHistoryValue?.describeSymptoms !== ""
                ? createTextRuns([
                    `${pronounPrefer} described ${pronoun} symptoms at that time as ${req.body?.pastHistoryValue?.describeSymptoms}. `,
                  ])
                : []),

              ...(req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported that ${pronounPrefer} has had so much energy that ${pronounPrefer} does not need to sleep for `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied that ${pronounPrefer} has ever had so much energy that ${pronounPrefer} does not need to sleep for several days or a week at a time. `,
                  ])),
              ...(req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
                ? createTextRuns([
                    `${req.body?.pastHistoryValue?.sleptFewer4Hours} and ${pronoun} `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
                ? createTextLowerRuns([
                    `energy was ${req.body?.pastHistoryValue?.lackSleepEnergy} during that time. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes" &&
              req.body?.pastHistoryValue?.sleepFewer === "Yes"
                ? createTextRuns([
                    `During that time that ${pronounPrefer} slept fewer than 4 hours per night for 4-7 or more consecutive nights, he felt excessively tired. `,
                  ])
                : createTextRuns([
                    `During that time that ${pronounPrefer} slept fewer than 4 hours per night for 4-7 or more consecutive nights, he did not feel excessively tired. `,
                  ])),
              ...(req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
                ? createTextRuns([
                    `When ${pronounPrefer} experienced these episodes of decreased need for sleep, ${pronoun} mood was ${req.body?.pastHistoryValue?.mood}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
                ? req.body?.pastHistoryValue?.mood === "other"
                  ? createTextRuns([
                      `${req.body?.pastHistoryValue?.describeMood}`,
                    ])
                  : []
                : []),

              ...(req.body?.pastHistoryValue?.highEnergyTime === "Yes"
                ? createTextRuns([
                    `During this high energy time ${pronounPrefer} did engage in high-risk behaviors. `,
                  ])
                : createTextRuns([
                    `During this high energy time ${pronounPrefer} did not engage in any high-risk behaviors. `,
                  ])),
              ...(req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
                ? req.body?.pastHistoryValue?.alcoholSubstances === "Yes"
                  ? createTextRuns([
                      `During this decreased sleep episode, [${pronounPrefer} remained clean and sober ${pronounPrefer} was using substances]. `,
                    ])
                  : []
                : []),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${
                  req.body?.demographicInformation?.lastName
                } reported that ${formatExperienceFollowing(
                  prepositionPronoun,
                  pronounPrefer,
                  req.body?.pastHistoryValue?.experienceFollowing
                )}. `,
              ]),
              ...(req.body?.pastHistoryValue?.experienceFollowing !== ""
                ? createTextRuns([
                    `The thoughts, behaviors, or rituals ${pronounPrefer} reported experiencing are ${req.body?.pastHistoryValue?.recurrentRituals}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.experienceFollowing.length > 0
                ? req.body?.pastHistoryValue?.pastHistoryValue
                    ?.symptomsDrinkingAlcohol === "Yes"
                  ? createTextRuns([
                      `${pronounPrefer} was clean and sober throughout that time. `,
                    ])
                  : createTextRuns([
                      `${pronounPrefer} was not clean and sober throughout that time. `,
                    ])
                : []),

              ...(req.body?.pastHistoryValue?.harmKillYourSelf === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has been recently thinking about how ${pronounPrefer} might harm or kill ${manPronoun}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has not been recently thinking about how ${pronounPrefer} might harm or kill ${manPronoun}. `,
                  ])),
              ...(req.body?.pastHistoryValue?.experienceMuchEnergy === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reports ever experiencing so much energy that ${pronounPrefer} did not need to sleep for several days or a week at a time. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denies ever experiencing so much energy that ${pronounPrefer} did not need to sleep for several days or a week at a time. `,
                  ])),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.pastHistoryValue?.emotionalSymptomsRelationShip ===
              "Yes"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} reported that ${pronoun} emotional symptoms have had a negative effect upon ${pronoun} work, school, or relationships. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} denied that ${pronoun} emotional symptoms have had a negative effect upon ${pronoun} work, school, or relationships. `,
                  ])),

              ...createTextRuns([
                `${pronounPrefer} reported that ${pronoun} first symptoms of depression occurred ${req.body?.pastHistoryValue?.firstFeelDepressed}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} reported first experiencing high levels of anxiety ${req.body?.pastHistoryValue?.feelHighLevelAnxiety}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} has been diagnosed by a healthcare provider with the following mental health conditions: ${divideArray(
                  req.body?.pastHistoryValue?.diagnosedMentalHealth
                )}. `,
              ]),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName} reported that ${pronounPrefer} has received past medication treatment. `,
              ]),
              ...(req.body?.pastHistoryValue?.otherMedications === "Yes"
                ? createTextRuns([
                    `${pronoun} previous psychiatric medication regimen consisted of: ${req.body?.pastHistoryValue?.pastMedicationName}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.otherMedications === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported starting these psychiatric medications in the following timeframe: ${req.body?.pastHistoryValue?.startedMedicationDate}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.otherMedications === "Yes"
                ? createTextRuns([
                    `${pronoun} past psychiatric medications were stopped on: ${req.body?.pastHistoryValue?.stopedMedicationDate}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.otherMedications === "Yes"
                ? createTextRuns([
                    `${pronoun} stated that ${pronoun} past psychiatric medication produced ${formatMedication(
                      req.body?.pastHistoryValue?.pastPsychiatricMedication
                    )}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.otherMedications === "Yes"
                ? createTextRuns([
                    `${pronoun} past psychiatric medications were stopped due to ${stopedMedicationReason(
                      pronoun,
                      pronounPrefer,
                      req.body?.pastHistoryValue
                        ?.stopedPsychiatricMedicationsReason
                    )}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.otherMedications === "Yes"
                ? createTextRuns([
                    `This medication was prescribed by a ${req.body?.pastHistoryValue?.prescribeThisMedication}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.otherMedications === "Yes"
                ? createTextRuns([
                    `${pronoun} prescribing clinician was ${req.body?.pastHistoryValue?.prescribeThisMedicationNameDate}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.otherMedications === "Yes"
                ? createTextRuns([
                    `This prescribing clinician worked at ${req.body?.pastHistoryValue?.whatClinicWorked}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.otherMedications === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} also received past psychiatric treatment from ${req.body?.pastHistoryValue?.otherPsychiatrists}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.otherMedications === "Yes"
                ? createTextRuns([
                    `This psychiatric treatment lasted ${req.body?.pastHistoryValue?.thisPsychiatristSeeDate}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.otherMedications === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} attended these psychiatric appointments ${req.body?.pastHistoryValue?.attendedSessionsPsychiatrist}. `,
                  ])
                : []),

              ...(req.body?.pastHistoryValue
                ?.previouslyReceivedPsychotherapy === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has previously received psychotherapy. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has not previously received psychotherapy. `,
                  ])),
            ],
          }),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.pastHistoryValue
                ?.previouslyReceivedPsychotherapy === "Yes"
                ? createTextRuns([
                    `When ${surname}${req.body?.demographicInformation?.lastName} was asked when ${pronounPrefer} began psychotherapy treatment, ${pronounPrefer} responded, ${req.body.pastHistoryValue?.receivedPsychotherapyBegin}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue
                ?.previouslyReceivedPsychotherapy === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported attending psychotherapy for approximately ${req.body?.pastHistoryValue?.receivedPsychotherapyLong}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue
                ?.previouslyReceivedPsychotherapy === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} attended therapy ${req.body?.pastHistoryValue?.attendedSessionsPsychotherapy}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue
                ?.previouslyReceivedPsychotherapy === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} received psychotherapy treatment with ${req.body?.pastHistoryValue?.pastPsychotherapistsDate}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue
                ?.previouslyReceivedPsychotherapy === "Yes"
                ? createTextRuns([
                    `Additional therapy consisted of: ${req.body?.pastHistoryValue?.otherPsychotherapyTreatmentList}. `,
                  ])
                : []),
            ],
          }),

          storyParagraph(""),
          new Paragraph({
            children: [
              ...(req.body?.pastHistoryValue?.admittedPsychiatricHospital ===
              "Yes"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} has previously been admitted to a psychiatric hospital. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} has never previously been admitted to a psychiatric hospital. `,
                  ])),

              ...(req.body?.pastHistoryValue?.admittedPsychiatricHospital ===
              "Yes"
                ? createTextRuns([
                    `${pronounPrefer} was admitted to these hospitals for ${divideArray(
                      req.body?.pastHistoryValue
                        ?.psychiatricHospitalizationReason
                    )}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.admittedPsychiatricHospital ===
              "Yes"
                ? createTextRuns([
                    `The treatment ${pronounPrefer} received during these hospitalizations consisted of ${req.body?.pastHistoryValue?.receivedTreatment}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.admittedPsychiatricHospital ===
              "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has been admitted to the following psychiatric hospitals: ${req.body?.pastHistoryValue?.admittedHospitalName}. `,
                  ])
                : createTextRuns([
                    `has never been admitted to a psychiatric hospital. `,
                  ])),
              ...(req.body?.pastHistoryValue?.admittedPsychiatricHospital ===
              "Yes"
                ? createTextRuns([
                    `The date of hospitalizations is ${req.body?.pastHistoryValue?.hospitalizedDate}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.admittedPsychiatricHospital ===
              "Yes"
                ? createTextRuns([
                    `These hospitalizations lasted ${req.body?.pastHistoryValue?.hospitalizedLong}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.suicidalIdeation === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} had experienced suicidal ideation. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} had never experienced suicidal ideation. `,
                  ])),
            ],
          }),

          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.pastHistoryValue?.suicideAttempt === "Yes"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} had made a suicide attempt. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} had never made a suicide attempt. `,
                  ])),

              ...(req.body?.pastHistoryValue?.suicideAttempt === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has attempted suicide ${req.body?.pastHistoryValue?.attemptedSuicideTimes} times. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.suicideAttempt === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has attempted suicide by ${req.body?.pastHistoryValue?.suicideAllMethods}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.suicideAttempt === "Yes"
                ? createTextRuns([
                    `${pronoun} most recent attempt was ${req.body?.pastHistoryValue?.attemptedSuicideDate}. `,
                  ])
                : []),

              ...(req.body?.pastHistoryValue?.otherPsychiatricSymptoms === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has experienced additional psychiatric symptoms besides those described above. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has denied experienced additional psychiatric symptoms besides those described above. `,
                  ])),
              ...(req.body?.pastHistoryValue?.otherPsychiatricSymptoms === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported experiencing additional psychiatric symptoms consisting of ${req.body?.pastHistoryValue?.describeOtherPsychiatricSymptoms}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue?.otherPsychotherapyTreatment ===
              "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported receiving additional psychotherapy or psychiatric medication treatment. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied receiving additional psychotherapy or psychiatric medication treatment. `,
                  ])),

              ...(req.body?.pastHistoryValue?.otherPsychotherapyTreatment ===
              "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported receiving additional psychotherapy or psychiatric medication treatment consisting of ${req.body?.pastHistoryValue?.describeOtherPsychotherapyTreatment}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue
                ?.evaluatedOtherwisePsychiatrists === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported being evaluated by psychiatrists or psychologists for other purpose outside of what is described above. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied being evaluated by psychiatrists or psychologists for any other purpose outside of what is described above. `,
                  ])),
              ...(req.body?.pastHistoryValue
                ?.evaluatedOtherwisePsychiatrists === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported being evaluated by psychiatrists or psychologists for ${req.body?.pastHistoryValue?.evaluationReason}. `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue
                ?.evaluatedOtherwisePsychiatrists === "Yes"
                ? createTextRuns([
                    `This evaluation was performed by ${req.body?.pastHistoryValue?.evaluationPerformed} `,
                  ])
                : []),
              ...(req.body?.pastHistoryValue
                ?.evaluatedOtherwisePsychiatrists === "Yes"
                ? createTextLowerRuns([
                    `and occurred on ${req.body?.pastHistoryValue?.evaluationOccur}. `,
                  ])
                : []),

              ...(req.body?.pastHistoryValue?.physicalAltercations === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has been involved in physical altercations or violence `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has not been involved in physical altercations or violence. `,
                  ])),
              ...(req.body?.pastHistoryValue?.physicalAltercations === "Yes"
                ? createTextRuns([
                    `${req.body?.pastHistoryValue?.physicialAltercationsMany} times. `,
                  ])
                : []),
            ],
          }),

          storyParagraph(""),

          TitleStoryParagraph("Substance Use"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.substanceUseValue?.followingSubstances.length > 0
                ? createTextRuns([
                    `${surname}${
                      req.body?.demographicInformation?.lastName
                    } endorsed using ${divideArray(
                      req.body?.substanceUseValue?.followingSubstances
                    )}. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} denied ever uding. `,
                  ])),

              ...(req.body?.substanceUseValue?.followingSubstances.length > 0
                ? createTextRuns([
                    `${pronounPrefer} currently uses ${formatCurrentlySubstance(
                      req.body?.substanceUseValue?.currentlySubstance
                    )}. `,
                  ])
                : []),
              ...(req.body?.substanceUseValue?.followingSubstances.length > 0
                ? createTextRuns([
                    `${pronounPrefer} used ${formatEachSubstance(
                      req.body?.substanceUseValue?.eachSubstanceList
                    )}. `,
                  ])
                : []),

              ...(req.body?.substanceUseValue?.followingSubstances.length > 0
                ? createTextRuns([
                    `${formatSubstanceListStartedOld(
                      req.body?.substanceUseValue?.eachSubstanceListStartedOld,
                      pronounPrefer
                    )}. `,
                  ])
                : []),

              ...(req.body?.substanceUseValue?.followingSubstances.length > 0
                ? createTextRuns([
                    `${pronoun} last used of ${cardField(
                      req.body?.substanceUseValue?.eachSubstanceLast
                    )}. `,
                  ])
                : []),

              ...(req.body?.substanceUseValue?.followingSubstances.length > 0 &&
              req.body?.substanceUseValue?.toleranceFollowingSubstances.length >
                0
                ? createTextRuns([
                    `${pronounPrefer} reported ${pronounPrefer} ${formatToleranceFollowingSubstances(
                      req.body?.substanceUseValue?.toleranceFollowingSubstances
                    )}. `,
                  ])
                : []),
              ...(req.body?.substanceUseValue?.followingSubstances.length > 0 &&
              req.body?.substanceUseValue?.withdrawalFollowingSubstances
                .length > 0
                ? createTextRuns([
                    `${pronounPrefer} reported ${pronounPrefer} ${formatWithdrawalFollowingSubstances(
                      req.body?.substanceUseValue?.withdrawalFollowingSubstances
                    )}. `,
                  ])
                : []),
            ],
          }),

          req.body?.substanceUseValue?.followingSubstances.length > 0
            ? storyParagraph("")
            : undefined,

          new Paragraph({
            children: [
              ...(req.body?.substanceUseValue?.followingSubstances.length > 0
                ? createTextRuns([
                    `${surname}${
                      req.body?.demographicInformation?.lastName
                    } endorsed the following substance related symptoms: ${formatRegardingAlcoholAnyFollowing(
                      req.body?.substanceUseValue?.regardingAlcoholAnyFollowing
                    )}. `,
                  ])
                : []),

              ...(req.body?.substanceUseValue?.enrolledTreatmentProgram ===
              "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has sought substance recovery treatment. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has never sought substance recovery treatment. `,
                  ])),
            ],
          }),

          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.substanceUseValue?.enrolledTreatmentProgram ===
              "Yes"
                ? req.body?.substanceUseValue?.completeTreatmentProgram ===
                  "Yes"
                  ? createTextRuns([
                      `${surname}${req.body?.demographicInformation?.lastName} completed this treatment program that lasted `,
                    ])
                  : createTextRuns([
                      `${surname}${req.body?.demographicInformation?.lastName} did not complete this treatment program that lasted. `,
                    ])
                : []),
              ...(req.body?.substanceUseValue?.enrolledTreatmentProgram ===
              "Yes"
                ? req.body?.substanceUseValue?.completeTreatmentProgram ===
                  "Yes"
                  ? createTextLowerRuns([
                      `from ${req.body?.substanceUseValue?.treatmentLastedDateFrom} to ${req.body?.substanceUseValue?.treatmentLastedDateTo}. `,
                    ])
                  : []
                : []),
              ...(req.body?.substanceUseValue?.enrolledTreatmentProgram ===
              "Yes"
                ? createTextRuns([
                    `Following this treatment program, ${surname}${
                      req.body?.demographicInformation?.lastName
                    } remained clean and sober for ${
                      req.body?.substanceUseValue?.remainedTreatmentClean
                    }, from ${formatDate(
                      req.body?.substanceUseValue?.cleanSoberLastedFrom
                    )}, to ${formatDate(
                      req.body?.substanceUseValue?.cleanSoberLastedTo
                    )}. `,
                  ])
                : []),
              ...(req.body?.substanceUseValue?.enrolledTreatmentProgram ===
              "Yes"
                ? createTextRuns([
                    `The longest that ${pronounPrefer} has remained completely clean and sober from all alcohol and substance use was for ${req.body?.substanceUseValue?.remainedTreatmentCleanLongest}. `,
                  ])
                : []),

              ...(req.body?.substanceUseValue?.enrolledTreatmentProgram ===
              "Yes"
                ? createTextRuns([
                    `The longest that ${pronounPrefer} has remained completely clean and sober from all alcohol and substance use was ${req.body?.substanceUseValue?.cleanSoberLongest}. `,
                  ])
                : []),

              ...(req.body?.substanceUseValue?.enrolledTreatmentProgram ===
              "Yes"
                ? req.body?.substanceUseValue
                    ?.previouslyDescribedPsychiatricClean === "Yes"
                  ? createTextRuns([
                      `While ${pronounPrefer} was clean and sober, ${pronounPrefer} did continue to experience his psychiatric symptoms described above. `,
                    ])
                  : createTextRuns([
                      `While ${pronounPrefer} was clean and sober, ${pronounPrefer} did not continue to experience his psychiatric symptoms described above. `,
                    ])
                : []),
            ],
          }),

          storyParagraph(""),
          TitleStoryParagraph("Medical History"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.medicalHistoryValue?.diagnosedHealthcareProvider
                .length > 0
                ? createTextRuns([
                    `${surname}${
                      req.body?.demographicInformation?.lastName
                    } reported having medical conditions consisting of ${divideArray(
                      req.body?.medicalHistoryValue?.diagnosedHealthcareProvider
                    )}. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} denied suffering from any general medical conditions.
          `,
                  ])),
              ...(req.body?.demographicInformation?.radioSexItem === "Female"
                ? req.body?.medicalHistoryValue?.pregnantPlanning === "Yes"
                  ? createTextRuns([
                      `${pronounPrefer} reports ${pronounPrefer} is currently pregnant.
          `,
                    ])
                  : req.body?.medicalHistoryValue?.pregnantPlanning === "No"
                  ? createTextRuns([
                      `${pronounPrefer} reports ${pronounPrefer} is not currently pregnant. `,
                    ])
                  : createTextRuns([
                      `${pronounPrefer} reports ${pronounPrefer} does not know if ${pronounPrefer} is currently pregnant. `,
                    ])
                : []),
              ...(req.body?.demographicInformation?.radioSexItem === "Female" &&
              req.body?.medicalHistoryValue?.pregnantPlanning === "Yes"
                ? req.body?.medicalHistoryValue?.plannedPregnancyProvider ===
                  "Yes"
                  ? createTextRuns([
                      `${pronounPrefer} reports ${pronounPrefer} is currently engaged with a healthcare provider regarding ${pronounPrefer} pregnancy. `,
                    ])
                  : createTextRuns([
                      `${pronounPrefer} reports ${pronounPrefer} is not currently engaged with a healthcare provider regarding ${pronounPrefer} pregnancy. `,
                    ])
                : []),

              ...createTextRuns([
                `${pronounPrefer} currently takes the following general medical medications: ${req.body?.medicalHistoryValue?.physicalHealthMedicationsLists}. `,
              ]),
              ...createTextRuns([
                `${pronoun} current general medical medications produce the following side effects ${req.body?.medicalHistoryValue?.medicationsSideEffect}. `,
              ]),
              ...(req.body?.medicalHistoryValue?.surgeries === "Yes"
                ? createTextRuns([`${pronounPrefer} has undergone surgery `])
                : createTextRuns([
                    `${pronounPrefer} has not undergone surgery. `,
                  ])),
              ...(req.body?.medicalHistoryValue?.surgeries === "Yes"
                ? createTextLowerRuns([
                    `consisting of ${req.body?.medicalHistoryValue?.surgeriesDateList}. `,
                  ])
                : []),
            ],
          }),

          req.body?.medicalHistoryValue?.futureMedicalPlan === "Yes"
            ? storyParagraph("")
            : undefined,

          new Paragraph({
            children: [
              ...(req.body?.medicalHistoryValue?.futureMedicalPlan === "Yes"
                ? createTextRuns([
                    `${surname} ${req.body?.demographicInformation?.lastName}'s treatment providers have plans for ${pronoun} future medical care. `,
                  ])
                : createTextRuns([
                    `${surname} ${req.body?.demographicInformation?.lastName}'s treatment providers do not have plans for ${pronoun} future medical care. `,
                  ])),
              ...(req.body?.medicalHistoryValue?.futureMedicalPlan === "Yes"
                ? createTextRuns([
                    `The future medical care planning for ${surname}${req.body?.demographicInformation?.lastName} consists of ${req.body?.medicalHistoryValue?.futureMedicalPlanList}. `,
                  ])
                : []),
              ...createTextRuns([
                `${pronoun} current primary care provider is ${req.body?.medicalHistoryValue?.currentPrimarycarePractitioner}. `,
              ]),
              ...createTextRuns([
                `${pronoun} past primary care provider was  ${req.body?.medicalHistoryValue?.pastprimarycarePractitioner}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} received this care as follows: ${req.body?.medicalHistoryValue?.periodReceiveProvider}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} described ${pronoun} hospitalization history as follows: ${req.body?.medicalHistoryValue?.hospitalListEverBeen}. `,
              ]),
              ...(req.body?.medicalHistoryValue?.allergiesMedication === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} suffers from allergies or intolerances to medication or food `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} does not suffer from allergies or intolerances to medication or food. `,
                  ])),

              ...(req.body?.medicalHistoryValue?.allergiesMedication === "Yes"
                ? createTextLowerRuns([
                    `consisting of ${req.body?.medicalHistoryValue?.allergiesList}. `,
                  ])
                : []),
            ],
          }),
          storyParagraph(""),

          TitleStoryParagraph("Family History"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.familyHistoryValue?.familyPsychiatricConditions !==
              ""
                ? createTextRuns([
                    `${surname}${
                      req.body?.demographicInformation?.lastName
                    } reported a family history of psychiatric conditions consisting of ${divideArray(
                      req.body?.familyHistoryValue?.familyPsychiatricConditions
                    )}. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} denied any family history of psychiatric diagnoses. `,
                  ])),
              ...(req.body?.familyHistoryValue?.familyPsychiatricConditions.filter(
                (item) => item === "other"
              ).length > 0
                ? createTextRuns([
                    `Additional psychiatric conditions ${pronoun} family members have been diagnosed with include ${req.body?.familyHistoryValue?.psychiatricConditionsList}. `,
                  ])
                : []),
              ...(req.body?.familyHistoryValue?.familyPsychiatricConditions.filter(
                (item) => item === "other"
              ).length > 0
                ? createTextRuns([
                    `with treatment consisting of ${req.body?.familyHistoryValue?.psychiatricConditionsTreatment}. `,
                  ])
                : []),
              ...(req.body?.familyHistoryValue?.familyAttemptedSuicide === "Yes"
                ? createTextRuns([
                    `${pronoun} family members have attempted or committed suicide. `,
                  ])
                : createTextRuns([
                    `${pronoun} family members have not attempted or committed suicide. `,
                  ])),
            ],
          }),

          storyParagraph(""),
          TitleStoryParagraph("Relationship History"),
          storyParagraph(""),
          new Paragraph({
            children: [
              ...(req.body?.relationshipHistoryValue
                ?.currentlyIntimateRelationship === "Yes"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} is currently involved in an intimate relationship. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} is not currently involved in an intimate relationship. `,
                  ])),

              ...(req.body?.relationshipHistoryValue
                ?.currentlyIntimateRelationship === "Yes" &&
              req.body?.relationshipHistoryValue?.currentlyMarried === "Yes"
                ? createTextRuns([`${pronoun} current marriage `])
                : createTextRuns([
                    `${pronoun} current significant intimate relationship. `,
                  ])),
              ...(req.body?.relationshipHistoryValue
                ?.currentlyIntimateRelationship === "Yes"
                ? createTextLowerRuns([
                    `has lasted ${req.body?.relationshipHistoryValue?.currentRelationshipInvolve} ${req.body?.relationshipHistoryValue?.currentlyUnit}. `,
                  ])
                : []),
              ...(req.body?.relationshipHistoryValue
                ?.currentlyIntimateRelationship === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported that ${pronoun} current relationship is ${divideArray(
                      req.body?.relationshipHistoryValue
                        ?.describeIntimateRelationship
                    )}. `,
                  ])
                : []),
              ...(req.body?.relationshipHistoryValue
                ?.currentlyIntimateRelationship === "Yes"
                ? req.body?.relationshipHistoryValue
                    ?.sufferPsychiatricConditions === "Yes"
                  ? createTextRuns([
                      `${pronoun} spouse or partner suffers from general medical or psychiatric condition(s). `,
                    ])
                  : createTextRuns([
                      `${pronoun} spouse or partner doesn't suffer from any general medical or psychiatric condition(s). `,
                    ])
                : []),

              ...(req.body?.relationshipHistoryValue
                ?.currentlyIntimateRelationship === "Yes"
                ? req.body?.relationshipHistoryValue
                    ?.stressfulPsychiatricConditions === "Yes"
                  ? createTextRuns([
                      `${pronounPrefer} reported that ${pronoun} partner or spouse’s medical or psychiatric condition is stressful for ${prepositionPronoun}. `,
                    ])
                  : createTextRuns([
                      `${pronounPrefer} reported that ${pronoun} partner or spouse’s medical or psychiatric condition is not stressful for ${prepositionPronoun}. `,
                    ])
                : []),

              ...(req.body?.relationshipHistoryValue
                ?.currentlyIntimateRelationship === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} described the occupation of ${pronoun} significant other as follows: ${req.body?.relationshipHistoryValue?.PartnerOccupation}. `,
                  ])
                : []),

              ...createTextRuns([
                `${pronounPrefer} has been married ${req.body?.relationshipHistoryValue?.marriedNumber} times. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} reported a history of ${formatNumber(
                  req.body?.relationshipHistoryValue?.intimateRelationshipTimes
                )} long term intimate relationships. `,
              ]),
              ...createTextRuns([
                `These relationship lasted ${req.body?.relationshipHistoryValue?.longTermRelationshipsLast}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} stated that ${pronoun} past relationships ended due to ${req.body?.relationshipHistoryValue?.reasonPreviousRelationships}. `,
              ]),
              ...(req.body?.relationshipHistoryValue?.domesticViolence === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported a history of domestic violence. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied a history of domestic violence. `,
                  ])),
            ],
          }),

          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.relationshipHistoryValue?.haveChildren === "Yes"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} has children. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} does not have children. `,
                  ])),

              ...(req.body?.relationshipHistoryValue?.haveChildren === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has ${req.body?.relationshipHistoryValue?.childrenNumberAndAge}. `,
                  ])
                : []),
              ...(req.body?.relationshipHistoryValue?.haveChildren === "Yes"
                ? createTextRuns([
                    `${pronoun} children are doing ${req.body?.relationshipHistoryValue?.childrenDoingSchool} in school or work. `,
                  ])
                : []),
              ...(req.body?.relationshipHistoryValue?.haveChildren === "Yes"
                ? createTextRuns([
                    `${pronoun} relationship with ${pronoun} children is ${req.body?.relationshipHistoryValue?.relationshipChildren}. `,
                  ])
                : []),
              ...(req.body?.relationshipHistoryValue?.haveChildren === "Yes" &&
              req.body?.relationshipHistoryValue?.childrenHealthIssues === "Yes"
                ? createTextRuns([
                    `${pronoun} children have general or mental health issues. `,
                  ])
                : createTextRuns([])),
            ],
          }),

          storyParagraph(""),

          TitleStoryParagraph("Employment History"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName} reported that ${pronoun} current employment status is ${req.body?.employmentHistoryValue?.currentEmploymentStatus}. `,
              ]),
              ...(req.body?.employmentHistoryValue?.currentEmploymentStatus ===
                "employed at less than 20 hours per week" ||
              req.body?.employmentHistoryValue?.currentEmploymentStatus ===
                "employed at more than 20 hours per week, but not full time" ||
              req.body?.employmentHistoryValue?.currentEmploymentStatus ===
                "employed full time"
                ? createTextLowerRuns([
                    `at ${req.body?.employmentHistoryValue?.employerName} `,
                  ])
                : []),
              ...(req.body?.employmentHistoryValue?.currentEmploymentStatus ===
                "employed at less than 20 hours per week" ||
              req.body?.employmentHistoryValue?.currentEmploymentStatus ===
                "employed at more than 20 hours per week, but not full time" ||
              req.body?.employmentHistoryValue?.currentEmploymentStatus ===
                "employed full time"
                ? createTextLowerRuns([
                    `as a ${req.body?.employmentHistoryValue?.employmentTitle}. `,
                  ])
                : []),
              ...(req.body?.employmentHistoryValue?.currentEmploymentStatus ===
                "employed at less than 20 hours per week" ||
              req.body?.employmentHistoryValue?.currentEmploymentStatus ===
                "employed at more than 20 hours per week, but not full time" ||
              req.body?.employmentHistoryValue?.currentEmploymentStatus ===
                "employed full time"
                ? createTextRuns([
                    `${pronoun} employment duties include ${req.body?.employmentHistoryValue?.jobDuties}. `,
                  ])
                : []),
              ...(req.body?.employmentHistoryValue?.currentEmploymentStatus ===
                "employed at less than 20 hours per week" ||
              req.body?.employmentHistoryValue?.currentEmploymentStatus ===
                "employed at more than 20 hours per week, but not full time" ||
              (req.body?.employmentHistoryValue?.currentEmploymentStatus ===
                "employed full time" &&
                req.body?.employmentHistoryValue?.difficultyJobDuties === "Yes")
                ? createTextRuns([
                    `${pronounPrefer} has difficulty performing ${pronoun} job duties. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has not difficulty performing ${pronoun} job duties. `,
                  ])),
            ],
          }),

          storyParagraph(`${pronoun} employment history is as follows:`),
          storyParagraph(`
            ${formatEmployerList(
              req.body?.employmentHistoryValue?.employerList,
              req.body.demographicInformation.lastName
            )}`),

          // table(req.body?.employmentHistoryValue?.employerList),

          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.employmentHistoryValue?.pastWorkplaceInjuries ===
              "Yes"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} reported a history of workplace injury `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} denied any history of workplace injury. `,
                  ])),
              ...(req.body?.employmentHistoryValue?.pastWorkplaceInjuries ===
              "Yes"
                ? createTextLowerRuns([
                    `in ${req.body?.employmentHistoryValue?.injuriesOccurTime}. `,
                  ])
                : []),
              ...(req.body?.employmentHistoryValue?.pastWorkplaceInjuries ===
              "Yes"
                ? createTextRuns([
                    `${pronoun} injury consisted of the following:${req.body?.employmentHistoryValue?.injuryNature}. `,
                  ])
                : []),
              ...(req.body?.employmentHistoryValue?.workerCompensationClaim ===
              "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported a history of submitting (a) Workers’ Compensation claim(s). `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied ever submitting a Workers’ Compensation claim. `,
                  ])),
              ...(req.body?.employmentHistoryValue?.placedDisability === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported a history of being placed on disability. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied ever being placed on disability. `,
                  ])),

              ...(req.body?.employmentHistoryValue?.receivedNegativeWork ===
              "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has received negative work evaluations, terminations, or disciplinary action for ${req.body?.employmentHistoryValue?.workEvaluationsExplain}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has never received negative work evaluations, terminations, or disciplinary action. `,
                  ])),

              ...createTextRuns([
                `${pronounPrefer} receives financial income through ${divideArray(
                  req.body?.employmentHistoryValue?.currentSourcesIncome
                )}. `,
              ]),
            ],
          }),

          storyParagraph(""),
          TitleStoryParagraph("Education History"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName}'s highest education level is ${req.body?.educationHistoryValue?.highestLevelEducation}. `,
              ]),
              ...(req.body?.educationHistoryValue?.highestLevelEducation ===
              "currently a student"
                ? createTextRuns([
                    `${pronounPrefer} described ${pronoun} current education program as consisting of the following: ${req.body?.educationHistoryValue?.currentlyEnrolledEducation}. `,
                  ])
                : []),
              ...createTextRuns([
                `${pronounPrefer} reported that ${pronounPrefer} received mostly ${divideArray(
                  req.body?.educationHistoryValue?.mostlyReceiveGrade
                )} throughout ${pronoun} education. `,
              ]),
            ],
          }),

          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.educationHistoryValue?.learningDisability === "Yes"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} reported a history of having learning disabilities or being placed in special education classes `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} denied any history of having learning disabilities or being placed in special education classes. `,
                  ])),
              ...(req.body?.educationHistoryValue?.learningDisability === "Yes"
                ? createTextLowerRuns([
                    `consisting of ${req.body?.educationHistoryValue?.describeLearningDifficulties}. `,
                  ])
                : []),
              ...(req.body?.educationHistoryValue?.graduateHighSchool === "Yes"
                ? createTextRuns([`${pronounPrefer} graduated high school. `])
                : createTextRuns([
                    `${pronounPrefer} did not graduate high school. `,
                  ])),
              ...(req.body?.educationHistoryValue?.graduateHighSchool === "Yes"
                ? req.body?.educationHistoryValue?.graduateOnTime === "Yes"
                  ? createTextRuns([`${pronounPrefer} graduated on time. `])
                  : createTextRuns([
                      `${pronounPrefer} did not graduate on time. `,
                    ])
                : []),
              ...(req.body?.educationHistoryValue?.goToCollege === "Yes"
                ? createTextRuns([`${pronounPrefer} attended college. `])
                : createTextRuns([
                    `${pronounPrefer} did not attend college. `,
                  ])),

              ...(req.body?.educationHistoryValue?.goToCollege === "Yes"
                ? req.body?.educationHistoryValue?.completeYourDegree === "Yes"
                  ? createTextRuns([`${pronounPrefer} completed a degree. `])
                  : createTextRuns([
                      `${pronounPrefer} did not complete a degree. `,
                    ])
                : []),

              ...(req.body?.educationHistoryValue?.goToCollege === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} attended ${req.body?.educationHistoryValue?.collegeName} `,
                  ])
                : []),
              ...(req.body?.educationHistoryValue?.goToCollege === "Yes"
                ? createTextLowerRuns([
                    `and studied ${req.body?.educationHistoryValue?.collegeMajor}. `,
                  ])
                : []),
            ],
          }),

          storyParagraph(""),

          TitleStoryParagraph("Social History"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.socialHistoryValue?.barriersReceivingHealthcare ===
              "Yes"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} is experiencing barriers to receiving healthcare `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} is not experiencing barriers to receiving healthcare. `,
                  ])),
              ...(req.body?.socialHistoryValue?.barriersReceivingHealthcare ===
              "Yes"
                ? createTextLowerRuns([
                    `consisting of ${divideArray(
                      req.body?.socialHistoryValue?.selectbarriersHealthcare
                    )}. `,
                  ])
                : []),
              ...createTextRuns([
                `${pronoun} current living situation consists of ${formatCurrentLivingSituation(
                  pronoun,
                  req.body?.socialHistoryValue?.describeCurrentLivingSituation
                )}. `,
              ]),
            ],
          }),

          req.body?.socialHistoryValue?.describeCurrentLivingSituation
            .length !== 0 &&
          !(
            req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
              (item) => item === "homeless"
            ).length > 0
          ) &&
          !(
            req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
              (item) => item === "living alone"
            ).length > 0
          )
            ? storyParagraph("")
            : undefined,

          new Paragraph({
            children: [
              ...(req.body?.socialHistoryValue?.describeCurrentLivingSituation
                .length !== 0 &&
              !(
                req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
                  (item) => item === "homeless"
                ).length > 0
              ) &&
              !(
                req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
                  (item) => item === "living alone"
                ).length > 0
              )
                ? createTextRuns([
                    `${surname}${
                      req.body?.demographicInformation?.lastName
                    } is ${
                      req.body?.socialHistoryValue
                        ?.describeCurrentLivingSituation
                    } with ${pronoun} ${divideArray(
                      req.body?.socialHistoryValue?.livesYourHome
                    )}. `,
                  ])
                : []),

              ...(req.body?.socialHistoryValue?.describeCurrentLivingSituation
                .length !== 0 &&
              req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
                (item) => item !== "homeless" && item !== "other"
              ).length > 0
                ? req.body?.socialHistoryValue?.ownYourHome === "Yes"
                  ? createTextRuns([`${pronounPrefer} owns ${pronoun} home. `])
                  : createTextRuns([
                      `${pronounPrefer} does not own ${pronoun} home. `,
                    ])
                : []),
              ...(req.body?.socialHistoryValue?.presentTimeDanger === "Yes"
                ? createTextRuns([
                    `${surname} ${req.body?.demographicInformation?.lastName} feels in danger at the present time due to ${req.body?.socialHistoryValue?.describeFeelDanger}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} does not feel in danger at the present time. `,
                  ])),
              ...createTextRuns([
                `${pronounPrefer} described the stressors that are not related to work that occurred in the past year as follows: ${req.body?.socialHistoryValue?.allStressorsPastYear}. `,
              ]),
              ...(req.body?.socialHistoryValue?.stressorsAffect === "Yes"
                ? createTextRuns([
                    `These stressors contributed to ${pronoun} emotional symptoms `,
                  ])
                : createTextRuns([
                    `These stressors did not contribute to ${pronoun} emotional symptoms. `,
                  ])),
              ...createTextLowerRuns([
                `in the following ways: ${req.body?.socialHistoryValue?.eachStressorsAffect}. `,
              ]),

              ...(req.body?.socialHistoryValue?.otherStressorsBesides === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported additional stressors. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denied additional stressors. `,
                  ])),

              ...(req.body?.socialHistoryValue?.otherStressorsBesides === "Yes"
                ? createTextRuns([
                    `The additional stressors he has experienced consisted of ${req.body?.socialHistoryValue?.explainAllStressors}. `,
                  ])
                : []),
              ...(req.body?.socialHistoryValue?.otherStressorsBesides === "Yes"
                ? req.body?.socialHistoryValue?.affectEmotionalSymptoms ===
                  "Yes"
                  ? createTextRuns([
                      `These stressors contributed to ${pronoun} emotional symptoms `,
                    ])
                  : createTextRuns([
                      `These stressors did not contribute to ${pronoun} emotional symptoms. `,
                    ])
                : []),
              ...(req.body?.socialHistoryValue?.otherStressorsBesides === "Yes"
                ? createTextLowerRuns([
                    `in the following ways: ${req.body?.socialHistoryValue?.eachAffectEmotionalSymptoms}. `,
                  ])
                : []),

              ...(req.body?.socialHistoryValue?.otherStressorsExperience ===
              "Yes"
                ? createTextRuns([
                    `${pronounPrefer} is experiencing other stressors consisting of ${req.body?.socialHistoryValue?.explainStressorsExperience}. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} is not experiencing other stressors. `,
                  ])),
            ],
          }),

          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.criminalHistoryValue?.arrested === "Yes"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} reported a history of arrests. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} denied any history of criminal behavior or arrests. `,
                  ])),
              ...(req.body?.criminalHistoryValue?.arrested === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} reported a history or arrests on ${req.body?.criminalHistoryValue?.arrestedDate} `,
                  ])
                : []),

              ...(req.body?.criminalHistoryValue?.arrested === "Yes"
                ? createTextLowerRuns([
                    `for the charges of ${req.body?.criminalHistoryValue?.charges}. `,
                  ])
                : []),
              ...(req.body?.criminalHistoryValue?.arrested === "Yes"
                ? createTextRuns([
                    `${pronoun} past sentences lasted ${req.body?.criminalHistoryValue?.everIncarcerated}. `,
                  ])
                : []),

              ...(req.body?.criminalHistoryValue?.arrested === "Yes"
                ? req.body?.criminalHistoryValue?.currentlyParole === "Yes"
                  ? createTextRuns([
                      `${pronounPrefer} is currently on parole or probation. `,
                    ])
                  : createTextRuns([
                      `${pronounPrefer} is not currently on parole or probation. `,
                    ])
                : []),
            ],
          }),

          // req.body?.socialHistoryValue?.describeCurrentLivingSituation
          //   .length !== 0 &&
          // req.body?.socialHistoryValue?.describeCurrentLivingSituation.filter(
          //   (item) => item !== "homeless" && item !== "other"
          // ).length > 0
          //   ? storyParagraph(
          //       `${pronounPrefer} is experiencing additional stressors in ${pronoun} life consisting of ${req.body?.socialHistoryValue?.describeAdditionalStressors}. `
          //     )
          //   : undefined,

          storyParagraph(""),

          new Paragraph({
            children: [
              ...(req.body?.violenceHistoryValue?.physicalAltercations === "Yes"
                ? createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} reported a history of physical violence. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} denied any history of physical altercations or violence. `,
                  ])),

              ...(req.body?.violenceHistoryValue?.physicalAltercations === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has been involved in ${formatNumber(
                      req.body?.violenceHistoryValue?.altercationsTimes
                    )} `,
                  ])
                : []),
              ...(req.body?.violenceHistoryValue?.physicalAltercations === "Yes"
                ? createTextLowerRuns([
                    `physical altercations in ${pronoun} lifetime. These altercations were due to ${req.body?.violenceHistoryValue?.circumstancesSurrounding}. `,
                  ])
                : []),
              ...(req.body?.violenceHistoryValue?.thoughtsHurtAnyone === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} endorses having thoughts of wanting to hurt someone. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} denies having thoughts of wanting to hurt anyone. `,
                  ])),

              ...(req.body?.violenceHistoryValue?.thoughtsHurtAnyone === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} described ${pronoun} thoughts of violence towards others as follows: ${req.body?.violenceHistoryValue?.explainAccomplishingHurt}. `,
                  ])
                : []),

              ...(req.body?.violenceHistoryValue?.victimViolence === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has been the victim of violence. `,
                  ])
                : createTextRuns([
                    `${pronounPrefer} has not been the victim of violence. `,
                  ])),

              ...(req.body?.violenceHistoryValue?.victimViolence === "Yes"
                ? req.body?.violenceHistoryValue?.currentlyDangerViolence ===
                  "Yes"
                  ? createTextRuns([
                      `${pronounPrefer} is currently in danger of violence. `,
                    ])
                  : createTextRuns([
                      `${pronounPrefer} is not currently in danger of violence. `,
                    ])
                : []),
            ],
          }),

          storyParagraph(""),
          new Paragraph({
            children: [
              ...(req.body?.militaryHistoryValue?.enrolledMilitary === "Yes"
                ? createTextRuns([
                    `${surname}${
                      req.body?.demographicInformation?.lastName
                    } reported a history of enlisting in the military consisting of the ${
                      req.body?.militaryHistoryValue?.branchMilitary
                    } from ${formatDate(
                      req.body?.militaryHistoryValue?.militaryDatesFrom
                    )}, to ${formatDate(
                      req.body?.militaryHistoryValue?.militaryDatesTo
                    )}, as a ${req.body?.militaryHistoryValue?.militaryJob}. `,
                  ])
                : createTextRuns([
                    `${surname}${req.body?.demographicInformation?.lastName} denied a history of enlisting in the military. `,
                  ])),

              ...(req.body?.militaryHistoryValue?.enrolledMilitary === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} was discharged as ${req.body?.militaryHistoryValue?.dischargeStatus}. `,
                  ])
                : []),
            ],
          }),

          storyParagraph(""),

          TitleStoryParagraph("Current Daily Activities"),
          storyParagraph(""),
          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName} awakens on work days at ${req.body?.currentDailyActivitiesValue?.awakenTimeWorkDays}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} awakens on non-work days at ${req.body?.currentDailyActivitiesValue?.awakenTimeNotWorkDays}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} typically goes to bed at ${req.body?.currentDailyActivitiesValue?.goToBed} `,
              ]),
              ...createTextLowerRuns([
                `and falls asleep at ${req.body?.currentDailyActivitiesValue?.fallAsleepTime}. `,
              ]),
            ],
          }),

          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName} described ${pronoun} activities from 6 a.m. to 8 a.m as ${req.body?.currentDailyActivitiesValue?.do6am}; `,
              ]),
              ...createTextRuns([
                `from 8 a.m. to 10 a.m as ${req.body?.currentDailyActivitiesValue?.do8am}; `,
              ]),
              ...createTextRuns([
                `from 10 a.m. to 12 p.m. as ${req.body?.currentDailyActivitiesValue?.do10am}; `,
              ]),
              ...createTextRuns([
                `from 12 p.m. to 2 p.m as ${req.body?.currentDailyActivitiesValue?.do12pm}; `,
              ]),
              ...createTextRuns([
                `from 2 p.m. to 4 p.m as ${req.body?.currentDailyActivitiesValue?.do2pm}; `,
              ]),
              ...createTextRuns([
                `from 4 p.m. to 6 p.m. as ${req.body?.currentDailyActivitiesValue?.do4pm}; `,
              ]),
              ...createTextRuns([
                `from 6 p.m. to 8 p.m as ${req.body?.currentDailyActivitiesValue?.do6pm}; `,
              ]),
              ...createTextRuns([
                `from 8 p.m. to 10 p.m. as ${req.body?.currentDailyActivitiesValue?.do8pm}; `,
              ]),
              ...createTextRuns([
                `from 10 p.m. to 12 a.m. or to bedtime as ${req.body?.currentDailyActivitiesValue?.do10pm}; `,
              ]),
              ...createTextLowerRuns([
                `and from 12 p.m. to 6 a.m as ${req.body?.currentDailyActivitiesValue?.do12p6am}. `,
              ]),
            ],
          }),

          storyParagraph(""),
          storyParagraph(
            `${surname}${req.body?.demographicInformation?.lastName} described his leisure activities or hobbies as ${req.body?.currentDailyActivitiesValue?.leisureActivities}. `
          ),
          storyParagraph(""),

          formatTroubleFollowing(
            req.body?.currentDailyActivitiesValue?.troubleFollowing
          )
            ? storyParagraph(
                `${surname}${
                  req.body?.demographicInformation?.lastName
                } reported impairment in ${formatTroubleFollowing(
                  req.body?.currentDailyActivitiesValue?.troubleFollowing
                )}. `
              )
            : undefined,

          formatTroubleFollowingNo(
            req.body?.currentDailyActivitiesValue?.troubleFollowing
          )
            ? storyParagraph(
                `${surname}${
                  req.body?.demographicInformation?.lastName
                } denied any history of difficulty in performing simple and repetitive tasks, ${formatTroubleFollowingNo(
                  req.body?.currentDailyActivitiesValue?.troubleFollowing
                )}. `
              )
            : undefined,

          storyParagraph(""),

          new Paragraph({
            children: [
              ...(formatDailyLivingFollowing(
                req.body?.currentDailyActivitiesValue.dailyLivingFollowing
              ).resultIndepently
                ? createTextRuns([
                    `${surname}${
                      req.body?.demographicInformation?.lastName
                    } reported that ${pronounPrefer} is able to perform all of the following activities independently and without assistance: ${
                      formatDailyLivingFollowing(
                        req.body?.currentDailyActivitiesValue
                          ?.dailyLivingFollowing
                      ).resultIndepently
                    }. `,
                  ])
                : []),
              ...(formatDailyLivingFollowing(
                req.body?.currentDailyActivitiesValue.dailyLivingFollowing
              ).resultNeedHelp
                ? createTextRuns([
                    `${pronounPrefer} reported that ${pronounPrefer} needs help when ${
                      formatDailyLivingFollowing(
                        req.body?.currentDailyActivitiesValue
                          .dailyLivingFollowing
                      ).resultNeedHelp
                    }. `,
                  ])
                : []),

              ...(formatDailyLivingFollowing(
                req.body?.currentDailyActivitiesValue.dailyLivingFollowing
              ).resultDon
                ? createTextRuns([
                    `${pronounPrefer} does not do ${
                      formatDailyLivingFollowing(
                        req.body?.currentDailyActivitiesValue
                          .dailyLivingFollowing
                      ).resultDon
                    }. `,
                  ])
                : []),

              ...(formatDailyLivingFollowing(
                req.body?.currentDailyActivitiesValue.dailyLivingFollowing
              ).resultCan
                ? createTextRuns([
                    `${pronounPrefer} can't perform ${
                      formatDailyLivingFollowing(
                        req.body?.currentDailyActivitiesValue
                          .dailyLivingFollowing
                      ).resultCan
                    }. `,
                  ])
                : []),
              ...(formatDailyLivingFollowing(
                req.body?.currentDailyActivitiesValue.dailyLivingFollowing
              ).resultNA
                ? createTextRuns([
                    `${surname} ${
                      req.body?.demographicInformation?.lastName
                    } elected not to respond whether ${pronounPrefer} is able to perform the following tasks: ${
                      formatDailyLivingFollowing(
                        req.body?.currentDailyActivitiesValue
                          .dailyLivingFollowing
                      ).resultNA
                    }. `,
                  ])
                : []),
            ],
          }),

          storyParagraph(""),
          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName} was asked to rate the following tasks as producing no difficulty, some difficulty, much difficulty, or that ${pronounPrefer} is unable to perform. `,
              ]),
              ...(formatDifficultAmount(
                req.body?.currentDailyActivitiesValue?.difficultAmount
              ).resultNoDifficult
                ? createTextRuns([
                    `${pronounPrefer} responded that ${pronounPrefer} has no difficulty in ${
                      formatDifficultAmount(
                        req.body?.currentDailyActivitiesValue?.difficultAmount
                      ).resultNoDifficult
                    }. `,
                  ])
                : []),

              ...(formatDifficultAmount(
                req.body?.currentDailyActivitiesValue?.difficultAmount
              ).resultSomeDifficult
                ? createTextRuns([
                    `${pronounPrefer} responded that ${pronounPrefer} has some difficulty in ${
                      formatDifficultAmount(
                        req.body?.currentDailyActivitiesValue?.difficultAmount
                      ).resultSomeDifficult
                    }. `,
                  ])
                : []),

              ...(formatDifficultAmount(
                req.body?.currentDailyActivitiesValue?.difficultAmount
              ).resultMuchDifficult
                ? createTextRuns([
                    `${pronounPrefer} responded having much difficulty with ${
                      formatDifficultAmount(
                        req.body?.currentDailyActivitiesValue?.difficultAmount
                      ).resultMuchDifficult
                    }. `,
                  ])
                : []),

              ...(formatDifficultAmount(
                req.body?.currentDailyActivitiesValue?.difficultAmount
              ).resultUnableDo
                ? createTextRuns([
                    `${pronounPrefer} responded that ${pronounPrefer} is unable to perform ${
                      formatDifficultAmount(
                        req.body?.currentDailyActivitiesValue?.difficultAmount
                      ).resultUnableDo
                    }. `,
                  ])
                : []),
            ],
          }),

          storyParagraph(""),

          TitleStoryParagraph("Developmental History"),
          storyParagraph(""),

          new Paragraph({
            children: [
              ...createTextRuns([
                `${surname}${req.body?.demographicInformation?.lastName} reported that ${pronounPrefer} was born in ${req.body?.developmentalValue?.bornPlace}. `,
              ]),
              ...createTextLowerRuns([
                `and raised in ${req.body?.developmentalValue?.primarilyRaised}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} was raised by ${pronoun} ${req.body?.developmentalValue?.raisedChilhood}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} described ${pronoun} relationship with the person who primarily raised ${pronoun} during ${pronoun} childhood as ${req.body?.developmentalValue?.describeRelationshipPerson}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} described ${pronoun} relationship with the primary adults who raised ${prepositionPronoun} when ${pronounPrefer} was a child as ${divideArray(
                  req.body?.developmentalValue?.relationshipPrimaryAdults
                )}. `,
              ]),
              ...(req.body?.developmentalValue?.haveSiblings === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} has ${formatNumber(
                      req.body?.developmentalValue?.siblingsMany
                    )} siblings. `,
                  ])
                : []),
              ...(req.body?.developmentalValue?.haveSiblings === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} was raised with all ${formatNumber(
                      req.body?.developmentalValue?.siblingsRaised
                    )} of them. `,
                  ])
                : []),
              ...(req.body?.developmentalValue?.haveSiblings === "Yes"
                ? createTextRuns([
                    `${pronounPrefer} described ${pronoun} relationship with ${pronoun} siblings as ${divideArray(
                      req.body?.developmentalValue?.relationshipSiblings
                    )}. `,
                  ])
                : []),
              ...createTextRuns([
                `${pronounPrefer} reported a history of experiencing ${divideArray(
                  req.body?.developmentalValue?.experienceAbuseChildhood
                )}. `,
              ]),

              ...(req.body?.developmentalValue?.parentsMarried === "Yes"
                ? createTextRuns([`${pronoun} parents were married. `])
                : createTextRuns([
                    `${pronoun} parents were ${req.body.developmentalValue.parentsDivorce}. `,
                  ])),
              ...(req.body?.developmentalValue?.parentsMarried === "Yes"
                ? req.body?.developmentalValue?.parentsRemainMarried === "Yes"
                  ? createTextRuns([`${pronoun} parents remained married`])
                  : []
                : []),
              ...(req.body?.developmentalValue?.parentsMarried === "Yes"
                ? createTextRuns([
                    `${req.body?.developmentalValue?.parentsDivorce}. `,
                  ])
                : []),
              ...(req.body?.developmentalValue?.parentsMarried === "No"
                ? createTextRuns([
                    `${pronounPrefer} was ${formatNumber(
                      req.body?.developmentalValue?.yourOldParentsDivorced
                    )} year old when ${pronoun} parents divorced or separated. `,
                  ])
                : []),

              ...(req.body?.developmentalValue?.motherWork === "Yes"
                ? createTextRuns([
                    `${pronoun} mother was employed as a ${req.body?.developmentalValue?.motherJob}. `,
                  ])
                : []),
              ...(req.body?.developmentalValue?.motherWork === "Yes"
                ? req.body?.developmentalValue?.motherStillWork === "Yes"
                  ? createTextRuns([`${pronoun} mother still works. `])
                  : `${pronoun} mother doesn't work.`
                : []),

              ...(req.body?.developmentalValue?.motherCurrentLiving === "Yes"
                ? createTextRuns([`${pronoun} mother is currently living. `])
                : createTextRuns([
                    `${pronoun} mother is currently deceased. `,
                  ])),
              ...(req.body?.developmentalValue?.motherCurrentLiving === "No"
                ? createTextRuns([
                    `She died when she was ${req.body?.developmentalValue?.diedMotherOld} `,
                  ])
                : []),
              ...(req.body?.developmentalValue?.motherCurrentLiving === "No"
                ? createTextLowerRuns([
                    `from ${req.body?.developmentalValue?.whatDiedMother}. `,
                  ])
                : []),

              ...(req.body?.developmentalValue?.fatherWork === "Yes"
                ? createTextRuns([
                    `${pronoun} father was employed as a ${req.body?.developmentalValue?.fatherJob}. `,
                  ])
                : []),
              ...(req.body?.developmentalValue?.fatherWork === "Yes"
                ? req.body?.developmentalValue?.fatherStillWork === "Yes"
                  ? createTextRuns([`${pronoun} father still works. `])
                  : `${pronoun} father doesn't work.`
                : []),
              ...(req.body?.developmentalValue?.fatherCurrentLiving === "Yes"
                ? createTextRuns([`${pronoun} father is currently living. `])
                : createTextRuns([
                    `${pronoun} father is currently deceased. `,
                  ])),
              ...(req.body?.developmentalValue?.fatherCurrentLiving === "No"
                ? createTextRuns([
                    `he died when he was ${req.body?.developmentalValue?.diedFatherOld} `,
                  ])
                : []),
              ...(req.body?.developmentalValue?.fatherCurrentLiving === "No"
                ? createTextLowerRuns([
                    `from ${req.body?.developmentalValue?.whatDiedFather}. `,
                  ])
                : []),
              ...createTextRuns([
                `${pronounPrefer} ${socialLife(
                  req.body?.developmentalValue?.bestDescribesSocialLifeChild
                )}. `,
              ]),
              ...createTextRuns([
                `As a child, ${pronounPrefer} enjoyed ${req.body?.developmentalValue?.enjoyActivitiesChild}. `,
              ]),
            ],
          }),

          storyParagraph(""),
          TitleStoryParagraph("Additional Information"),
          storyParagraph(""),
          new Paragraph({
            children: [
              ...createTextRuns([
                `${pronounPrefer} also states ${req.body?.additionalValue?.evaluatingClinician}. `,
              ]),
              ...createTextRuns([
                `${pronounPrefer} also states ${req.body?.additionalValue?.yourAdditionalInformation}. `,
              ]),
            ],
          }),
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

  const zipFileName = `${
    req.body.demographicInformation?.firstName
  }_${year}-${month}-${day}-${uuidv4()}.zip`;
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
        const doc = new Doc({
          fileName: zipFileName,
          Date: Date.now(),
        });
        doc
          .save()
          .then(() => res.json(zipFileName))
          .catch((err) => res.json("Internal server error"));
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Internal server error");
    });
});

module.exports = router;
