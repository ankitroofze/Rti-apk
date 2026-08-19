import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  Dimensions,
  useWindowDimensions
} from 'react-native';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import WebLayout from '../components/WebLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteCopy } from '../constants/siteCopy';
import { getResponsiveWindowWidth, isMobileWebDevice } from '../utils/webDevice';

const contentsItems = [
  "What is the method to apply for information?",
  "How much time does it take to get information and what is the fee?",
  "What can be the reasons for denial of information?",
  "How to file an application to obtain information?",
  "Frequently Asked Questions?",
  "FAQs about complaint filing procedures?",
  "FAQs about writing RTI application?",
  "Public Information Officer duties and responsibilities?",
];

const faqData = [
  {
    id: 1,
    question: "What is the method to apply for information?",
    answer: [
      "Application should be typed or handwritten in English, Hindi, or the official language of that state in the name of the Information Officer, requesting the desired information.",
      "You don't need to give a reason for requesting the information; just pay the prescribed fee (unless you are below the poverty line).",
    ],
  },
  {
    id: 2,
    question: "How much time does it take to get information?",
    answer: [
      "Within 30 days from the date of application.",
      "48 hours for information related to a person's liberty or life and death. If the application is made to the Assistant Information Officer, add 5 more days to the above period.",
      "If third-party interests are involved, the period can extend to 40 days (maximum time + time given for representation). Failure to provide information within the given period is considered a denial.",
    ],
  },
  {
    id: 3,
    question: "What is the fee for this?",
    answer: [
      "The prescribed application fee should be as determined. If additional fees are required, they will be charged in writing with full accounting. The applicant can request a reconsideration of the fee charged from the Information Officer. No fee will be charged from people below the poverty line. If the Information Officer fails to provide information within the prescribed time, they must provide it free of cost.",
    ],
  },
  {
    id: 4,
    question: "What can be the reasons for denial of information?",
    answer: [
      "Information whose disclosure is prohibited.",
      "(S.8) If the information falls under someone else's copyright other than the state.",
      "(S.9) How to apply for information - FAQs about complaint filing procedures.",
    ],
  },
  {
    id: 5,
    question: "Where and how can I file a complaint?",
    answer: [
      "For complaints related to Central Government public authorities, you can approach the Central Information Commission (CIC). CIC address: August Kranti Bhawan, Bhikaji Kama Place, New Delhi 110066, website: www.cic.gov.in. For state government public authorities, contact the State Information Commission (SIC).",
      "Complaints related to state government public authorities should be filed with the respective State Information Commission. Additionally, it is beneficial to try mediation at the Secretary/Chief Secretary level with the head of the concerned organization or government department in the state capital.",
      "After filing a complaint, ensure its registration on the relevant website, check the registration number and current status. Also send a copy of your complaint to the Public Information Officer/First Appellate Authority along with the Central/State Information Commission. Complaint is additional along with second/final appeal available to applicants.",
    ],
  },
  {
    id: 6,
    question: "Are there prescribed formats for filing complaints? What can be asked in a complaint?",
    answer: [
      "For complaints related to Central Government public authorities, you can approach the Central Information Commission (CIC). CIC address: August Kranti Bhawan, Bhikaji Kama Place, New Delhi 110066, website: www.cic.gov.in. For state government public authorities, contact the State Information Commission (SIC).",
      "Complaints related to state government public authorities should be filed with the respective State Information Commission. Additionally, it is beneficial to try mediation at the Secretary/Chief Secretary level with the head of the concerned organization or government department in the state capital.",
      "After filing a complaint, ensure its registration on the relevant website, check the registration number and current status.",
      "Also send a copy of your complaint to the Public Information Officer/First Appellate Authority along with the Central/State Information Commission.",
      "Complaint is additional along with second/final appeal available to applicants.",
    ],
  },
  {
    id: 7,
    question: "Are there prescribed formats for filing complaints? What can be asked in a complaint?",
    answer: [
      "CIC and some SICs have prescribed formats for minimum information or documents. Attaching these with the complaint is necessary.",
      "Some State Commissions have made it mandatory to file complaints in prescribed format. Under this law, you can also demand punishment for the Public Information Officer/First Appellate Authority as well as claim compensation for not receiving information on time. If the desired information pertains to life and liberty, clearly write 'Life and liberty - urgent' on the complaint so that it gets prioritized and resolved on time. If the State Information Commission has email available, it is beneficial to follow up through it.",
    ],
  },
  {
    id: 8,
    question: "Do I have to pay any fee for filing a complaint?",
    answer: [
      "The Central Information Commission does not charge any fee for complaints. Some State Commissions charge fees for this.",
      "There is no time limit for filing a complaint, but it is best to file the complaint within a reasonable period from the occurrence of the cause of the complaint.",
    ],
  },
  {
    id: 9,
    question: "What response will I get to my complaint?",
    answer: [
      "Sometimes, even before the matter goes to the Central or State Information Commission, your complaint is resolved by the Public Information Officer/First Appellate Authority.",
      "Information Commissions have been given powers regarding sending summons, compelling appearance before court, submitting evidence on oath, presenting records, etc.",
      "Public Information Officers/First Appellate Authorities are flooded with appeals and complaints, leading to a large number of pending cases. It may take 12 to 36 months for your complaint to be heard.",
    ],
  },
  {
    id: 10,
    question: "What are the guidelines for writing an application? - OR - How to write an application?",
    answer: [
      "Properly framing questions while filing an RTI application is very important. Irrelevant or misleading questions give the Public Information Officer an opportunity to reject your application. Use the following guidelines -",
      "Use simple white paper to write the application. There's no need to use ruled paper or court stamp.",
      "You can write the text by hand or type it. There's no compulsion to type the text.",
      "Write the application in legible handwriting.",
      "No limit on number of pages.",
      "You can ask any number of questions in one application. But it's always better to ask fewer questions and ensure the questions in one application are related to each other.",
      "You can ask very short questions. But don't request a very large amount of information at once. Your name and signature must be on the application. You don't need to write your designation because every citizen has the right to information.",
      "Don't ask 'why' questions, i.e., questions asking for reasons. Such questions are likely to be rejected on the grounds that they don't fall under the purview of RTI.",
      "For example, 'Why didn't you approve this resolution?' is sure to be rejected. Do ask for reasons behind 'administrative' or 'quasi-judicial' decisions taken under Section 4(1)(d), if you are an 'affected person'.",
      "If you are requesting a large amount of information, ask for it on a CD to reduce costs. Remember, you don't need to provide a reason for requesting information.",
      "At the end of your application, provide details of the fee paid. For example: BC/DD/Indian Postal Order number, issuing bank or post office, date, details of cash receipt, etc.",
    ],
  },
  {
    id: 11,
    question: "In whose name should the application be made?",
    answer: [
      "Write the name, address, etc. of the Public Information Officer to whom you wish to apply. If you don't know the location of your concerned Public Information Officer/Assistant Public Information Officer, you can send your application to the concerned department, with appropriate fee, addressing it to 'Public Information Officer, through Department Head'.",
      "This application will be forwarded from the department head to the concerned Public Information Officer. Don't write the name of any specific Public Information Officer on your application, as processing could be hindered if that particular officer has been transferred elsewhere.",
    ],
  },
  {
    id: 12,
    question: "Are the application methods, rules, and fees different for each state?",
    answer: [
      "Central and state government public authorities, legislatures, and Supreme/High Courts have established different rules for RTI. The fee amount and payment method may vary by state, and you need to check the applicable rules for yourself.",
      "A person can pay the application fee through:",
      "- Paying cash in person (remember to take a receipt)",
      "- Through post office via: Demand Draft/Banker's Check, Indian Postal Order, Money Order (only in some states), Court Fee Stamp (only in some states)",
      "Some states have opened specific accounts for this purpose. You need to deposit your fee in that account by visiting any State Bank of India branch and attach the receipt to your application, OR you can send a Postal Order or Demand Draft drawn in the name of that account with your application.",
      "The Post and Telegraph Department has informed that for public authorities under Central RTI Rules, BC/DD/Indian Postal Order can be drawn in the name of 'Accounts Officer'.",
    ],
  },
  {
    id: 13,
    question: "How to write the first appeal under RTI?",
    answer: [
      "Follow these guidelines while writing the first appeal under RTI Act 2005 -",
      "The applicant must file the first appeal with the First Appellate Authority within 30 days of receiving the CPIO's decision.",
      "If no response is received from CPIO within 30 days from the date of acknowledgment by CPIO or ACPIO (or 35 days if application was made to ACPIO), the applicant must file the first appeal within 30 days from the expected date of receiving a response.",
      "You can get the name, designation, and address of the First Appellate Authority from the CPIO's decision letter.",
      "If you receive no response, visit the website of the concerned government department/office/undertaking and refer to the RTI logo for these details.",
      "If you still cannot get the details of the First Appellate Authority, address your first appeal as: First Appellate Authority under RTI Act 2005, through -------- Department Head/Office (also mention the address of the Chief Public Information Officer of the department/office)",
      "If you wish to be present during the hearing of the first appeal, mention this at the end of your appeal.",
      "No fee is charged for first appeals related to public authorities under the Central Government.",
      "Some states charge fees and require applications in specific formats. The applicant must 'attest' all copies of annexures mentioned in the appeal by writing 'attested' and signing fully underneath, and thus self-attest them.",
      "Keep one set of the appeal, postal receipts, registered post acknowledgment, etc., with yourself. You can also deliver these documents in person, but sending by registered post or speed post is better. Avoid sending through private courier.",
      "The First Appellate Authority is expected to decide within 30 days of receiving the first appeal. If valid reasons are provided in writing, they may get 15 more days, totalling 45 days. The First Appellate Authority can give their order in writing or orally.",
    ],
  },
  {
    id: 14,
    question: "How to file a second appeal under RTI?",
    answer: [
      "Fill out the appeal form given below, also fill out the list and chronological progress chart. Remove the words complaint/complainant if filing an appeal. Remove the words second appeal/appellant if filing a complaint. Get it typed in double spacing.",
      "Take one Xerox copy each of: Original RTI application, first appeal with annexures, application fee of Rs. 10 and other fees paid (Bank Demand Draft/pay slip/Postal Order/cash receipt), CPIO's fee demand letter (if any), postal receipt for sending original application and first appeal, postal acknowledgment/official receipt from CPIO and First Appellate Authority, decisions received from CPIO and First Appellate Authority (if any). Arrange all documents in order according to the list and write page numbers in the top right corner of each page. This will create one set for the second appeal/complaint.",
      "Make 4 more such sets after taking Xerox copies.",
      "Sign each page of the appeal, list, and sequence table (for all five sets). Write 'attested' on all Xerox copies and sign below that word to make all copies 'self-attested'.",
      "Send one set by speed post/registered post/certificate of posting to the Chief Public Information Officer and First Appellate Authority, and attach the Xerox copy of the receipt (after filling details in the list/sequence table) to the original set, the second appeal/complaint, and your own copy.",
      "Send the original set and one additional copy by registered AD post to the Commission at: Registrar, Central Information Commission, Second Floor, August Kranti Bhawan, Bhikaji Kama Place, New Delhi 110066.",
      "Avoid using private courier services.",
      "Keep one set for your reference along with proof of sending and the acknowledgment received from Chief Information Commission/Chief Public Information Officer/First Appellate Authority.",
      "You can request further investigation of this in the Chief Information Commission by sending one copy of the second appeal/complaint, without annexures. You can also attach a Xerox copy of the registered post receipt with it.",
      "While filing first or second appeal, you can also consult local voluntary organizations, NGOs, or individuals working in the field of RTI. Such services are generally free.",
    ],
  },
  {
    id: 15,
    question: "Who can obtain information under the RTI Act?",
    answer: [
      "Any Indian citizen can obtain information under this act. This law applies throughout India except Jammu and Kashmir.",
      "Indian citizens living abroad, i.e., OCIs and Persons of Indian Origin (PIOs with official cards), can also obtain information under this act.",
      "OCI and PIO category individuals can file applications with the help of the local Indian Embassy/Consulate/High Commission. They will be informed about the application fee in local currency and the payment method through the Indian Embassy/Consulate/High Commission.",
    ],
  },
  {
    id: 16,
    question: "How to file an RTI application?",
    answer: [
      "To ensure your RTI application reaches the Public Information Officer and to get proof of submission, use the following methods -",
      "Delivering in person - In this case, get signature, stamp, and date on your copy of the application and fee receipt from the Public Information Officer or the incoming department.",
      "By registered post, AD - The AD card received from the post office is considered proof of submission. However, if this card doesn't have proper signature, stamp, date, etc., follow up with the concerned post office.",
      "Take a printout of the delivery status and preserve it.",
      "Avoid using: Ordinary postal service, private courier services, as you won't get a reliable acknowledgment from them.",
      "Example questions (you can add your own questions to these): Information about the daily progress of action taken on my application/return/petition should be provided to me. For example: When and to which officer did my application/return/petition reach, how many days was it with them, and what action did they take? Information about names and positions of all officers who did and did not take action on my application.",
      "What action should be taken against these officers for not properly acting on the application and causing harassment to the public? When should this action be taken? By when will my work be completed?",
      "Provide a list of RTI applications filed after mine with the following information: Applicant/taxpayer/petitioner name/receipt no., date of filing application/return/petition, date of disposal of application/return/petition, provide copy/printout of documents containing acknowledgment of the above application/return/petition. Provide information of applications/returns/petitions filed after mine but disposed before mine and clarify the reasons for their early disposal.",
    ],
  },
  {
    id: 17,
    question: "When will the investigation of the above matter begin?",
    answer: [
      "Maharashtra: Method of obtaining information under RTI via post: Send a Demand Draft/Cheque of Rs. 10 in the name of the Public Authority/Government Office or make a Money Order or affix Court Fee Stamp of that value and send the application in the name of the Public Information Officer.",
      "Personally: You can go yourself or send another person to submit the application to the Public Information Officer and pay this fee at their office.",
    ],
  },
];

function CollapsibleLegalText({ children, readMoreLabel, showLessLabel }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewLength = 500;

  if (children.length <= previewLength) {
    return (
      <Text style={styles.legalTextFull}>
        {children}
      </Text>
    );
  }

  const preview = children.slice(0, previewLength);

  return (
    <View style={styles.legalContainer}>
      <Text style={styles.legalText}>
        {isExpanded ? children : `${preview}... `}
        <Text
          style={styles.readMoreButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? showLessLabel : readMoreLabel}
        </Text>
      </Text>
    </View>
  );
}

const isWeb = Platform.OS === 'web';

export default function RTIPage({ navigation }) {
  const { language } = useLanguage();
  const copy = getSiteCopy(language);
  const rtiCopy = copy.rti;
  const [openId, setOpenId] = useState(null);
  const { width } = useWindowDimensions();
  const responsiveWidth = getResponsiveWindowWidth(width);
  const isMobile = isMobileWebDevice() || responsiveWidth < 768;

  const toggle = (id) => setOpenId(openId === id ? null : id);

  const legalParagraphs = [
    "- Office Delay Act : RNI No . MAHBIL / 2009 / 31745 Reg . No . MH / MR / South - 327 / 2013 - 15\n\nMaharashtra Government Gazette Extraordinary Part One : Central Sub-Division - Year 5 , Issue 36 ] Tuesday , November 19 , 2013 / Kartik 28 , Shake 1935 Pages 22 , Price : Rs. 12 . 00\n\nExtraordinary Number 61 Authorized Publication General Administration Department : Madam Cama Marg , HutAtma Rajguru Chowk , Mantralaya , Mumbai 400 032 , Date 14 November 2013 .\n\nNotification Maharashtra Regulation of Government Servants' Transfers and Prevention of Delay in Performing Government Duties Act , 2005 : . . No POD - 1007 / Pra . No . 1 / 18 ( R . Va . Ka . ) .\n\nMaharashtra Government is making the following rules by exercising the powers provided under Section 14, Sub-section (2) of the Maharashtra Regulation of Government Servants' Transfers and Prevention of Delay in Performing Government Duties Act , 2005 (Maharashtra 20 of 2006) and all other powers enabling it in this behalf, and overruling all existing rules, orders, etc. made in this regard, and as required under Section 14, Sub-section (1) of the said Act, they are pre-published",
    "1. Short Title - (One) These rules shall be called the Prevention of Delay in Performing Government Duties Rules, 2013. 2. *Definitions. -* In these rules, unless the context otherwise requires, (a) 'Act' means the Maharashtra Regulation of Government Servants' Transfers and Prevention of Delay in Performing Government Duties Act, 2005 (Maharashtra 21 of 2006). (b) 'Administrative Audit' means the system determined by the government to verify whether the final decision on a file or matter in any office or department has been submitted through appropriate levels, i.e., three levels, based on delegated powers, and whether the time limit prescribed under Section 10, Sub-section (1) of the Act has been complied with while making decisions and taking necessary action. (c) 'Pending Matter' means a matter where further action is to be taken after the specified period has elapsed. (d) 'Matter' means a received file or other related documents, references, correspondence, notes, etc., and their collective set.",
    "2. Maharashtra Government Gazette, Extraordinary Part One - Central Sub-Division, November 19, 2013 / Kartik 28, Shake 1935 (d) 'Correspondence' means incoming and outgoing references in the decision-making process, including written letters, telegrams, inter-departmental notes, fax messages, e-mails, orders, circulars, government decisions issued by the government from time to time. (e) 'Dormant Matter' means a matter where the decision to be made falls under the authority of others besides the state government, including matters requiring collection of basic information or data from various authorities for compiling government reports, periodicals, statements, etc., and matters where final orders have been issued but waiting is required to ensure compliance with the terms of final orders. However, this does not include matters under Section 11 of the Act; (f) 'File' means a set of documents related to a specific subject assigned a distinct number, including one or more of the following parts: (one) Correspondence, (two) Notes, (three) Annexures to correspondence, (four) Annexures to notes: (g) 'Final Disposal' means the action taken on received reference or after exchange of views, the final decision on correspondence in the file, and no further action is pending on such reference or correspondence; (h) 'Format' means the format appended to these rules. (i) 'Immediate and Urgent Reference' means postal received including telegrams, telex messages, fax messages, letters, e-mails, etc., marked by the competent authority for immediate or urgent attention considering the seriousness of the subject, with the purpose of completing required action within the time mentioned in Section 10, Sub-section (1) of the Act; (j) 'In-charge Minister' means the minister in charge to whom the concerned subject or work has been assigned according to the Rules of Business of Maharashtra Government; (k) 'In-charge Branch Officer or Desk Officer' means an officer working at taluka or sub-divisional office or district or divisional or department level who has been nominated to dispose or finally dispose of the concerned subject or work in the desk; (l) 'Submission Level' means the three levels of government employees responsible for submitting matters to the officer who has been delegated the authority to make final decisions, considering the nature, level, and importance of various subjects handled in the office or department, for the purpose of final decision; (m) 'Note' means entries recorded on a file such as summary of previous documents, description and analysis of matters or questions under consideration, instructions regarding expediting any matter, and final orders. (n) Wherever words like file, matter, correspondence, note, draft, reference, opinion, proposal, forms, letters, postal are found, they include electronic form like e-file, e-matter, e-correspondence, e-note, e-draft, e-reference, e-opinion, e-proposal, e-forms, e-mail, etc. Also, wherever the word service (service or facility) is used, it includes providing service or facility to the concerned person through electronic means, (two) Words and phrases used in these rules but not defined shall have the meanings respectively assigned to them in the Act.",
    "3. Preparation of Citizen's Charter. - (1) The head of each administrative department in the Secretariat and the head of all offices under their administrative control, i.e., divisional level, district level, taluka level, sub-divisional level or local level, as the case may be, will prepare a separate Citizen's Charter for their concerned office. This Citizen's Charter will be at their respective headquarters,",
    "4. Maharashtra Government Gazette, Extraordinary Part One - Central Sub-Division, November 19, 2013* / Kartik 28, Shake 1935 consistent with the Citizen's Charter. This Citizen's Charter will be prepared and published based on instructions contained in circulars or letters issued by the government from time to time, displayed in a conspicuous place in the concerned office, and this information will be displayed in electronic form on the government's or department's website or portal. (2) The Citizen's Charter published under the provisions of Sub-rule (1) will be updated from time to time as necessary according to the government's revised policy or scheme or program or project or rules or orders, etc., and also by each office on 2nd May of every subsequent year. If there are objections or suggestions in the Citizen's Charter, each office, after considering them and discussing the difficulties of concerned officers and fully deliberating on suggestions received in this regard, will finalize and publish it. This information will also be displayed in electronic form on the government's or department's website or portal. (3) The prescribed documents for providing facilities or services from the office or department will be minimal; for that purpose, the head of each office or department will take a review accordingly. Format - A, required for providing facilities or services from the office or department, will be made easily available free of cost from the concerned office or department. The list of required documents will be specified in Format - B by the head of each office or department. This information will also be displayed in electronic form on the government's or department's website/portal. (4) Any application received from a citizen in Format - A will be checked according to the checklist given in Format - C regarding its completeness, and if found incomplete after checking, the applicant will be informed of the deficiencies on the spot so that the applicant can complete the formalities for filling the form. (5) If the citizen's application is complete, an acknowledgment will be given in Format - D, clearly mentioning the period specified in the office's or department's Citizen's Charter for providing that service or facility, and the office will ensure that the citizen does not have to come to the concerned office repeatedly. (6) The minimum period prescribed in the Citizen's Charter for providing service or facility will be determined considering the time limits in the relevant act and rules. If a complaint is filed against a defaulting officer for delay in providing service or facility, or if such default comes to the notice of the concerned office head or department head, the concerned office head or department head will complete the preliminary inquiry within fifteen days of office work. If it is found that the concerned government employee has regularly or knowingly and deliberately caused delay or negligence, responsibility will be fixed and a recommendation for departmental inquiry will be sent to the concerned competent authority, and the competent authority will issue orders for disciplinary action against the concerned officer or employee as per rules. (7) Information technology will be maximally used in offices, and highest priority will be given to e-Governance while providing facilities or services to citizens. Every administrative department in the Secretariat will, in consultation with their subordinate commissioners/department heads/office heads, implement a time-bound program for providing services or facilities through electronic means within the department. Services or facilities to be provided to citizens through electronic means will be determined within six months. Accordingly, services such as licenses, certificates, approvals, or payment of amounts as well as their application forms will be made available online. Information about this will be made available on the department's or office's website. For citizens who cannot avail online services, arrangements will also be made to provide services or facilities according to the current prevalent method.",
    "5. Publishing the list of powers delegated to subordinate officers for final decision. - The concerned Secretary of the administrative department at the Secretariat level, the department head at the divisional level, or the district level officer and subordinate officer, as the case may be, will prepare and publish a list of officers working under their supervision at various levels or to whom subject-wise or file-wise powers have been delegated for final decision, and the list will be displayed in a conspicuous place in the concerned office as provided in Section 1, Sub-section (1) of the Act. The said list of powers will be updated and published on 2nd May of every subsequent year. This information will also be displayed in electronic form on the government's or department's website or portal. Part One M. U. Vi. - 61 - 1A",
    "6. Maharashtra Government Gazette, Extraordinary Part One - Central Sub-Division, November 19, 2013 / Kartik 28, Shake 1935 5. Prohibition on delegating powers to government officers against whom departmental inquiry is ongoing. - Notwithstanding anything contained in Rule 4, (1) If any disciplinary inquiry is ongoing against any employee or officer under the relevant disciplinary rules regarding serious allegations, or if any officer has to face any criminal case or investigation, such employee or officer will not be delegated the power to make final decisions regarding any enforcement work or sensitive work or subject. (2) If a charge sheet has been served on any officer with allegations of misuse of government office or financial irregularity or embezzlement or corruption, or if a decision has been made at the level of the disciplinary inquiry officer to serve a charge sheet against such officer, or if such officer has been suspended for any such allegations, then even after reinstatement of such officer, until the decision of such inquiry or investigation is complete and the punishment awarded is implemented, or until such officer is completely acquitted of such allegations or accusations, no power will be delegated to such officer to make final decisions on enforcement or sensitive subjects: Provided that the government, after examining the merits of the case and recording reasons thereof, may consider delegating any power for enforcement or making final decisions on sensitive subjects to such government employee mentioned in Sub-rules (1) and (2).",
    "7. Determining the level of powers for final decision. - (1) Subject to the provisions of Section 9 of the Act, the level for delegation of powers for final decision will be determined by the office head or, as the case may be, department head, considering the government decisions and orders issued from time to time in this regard, with the approval of the concerned minister in charge of administrative departments: Provided that such submission level for the purpose of final decision shall not be with more than three officers. (2) A subject-wise list of delegation of each type of authority or power to the officer will be maintained. (3) If the specific competent officer delegated with the power to make final decisions is absent or on leave and the work of such competent authority cannot be postponed even temporarily, considering administrative convenience and urgency, the work of such competent authority will be distributed among other officers of that establishment: Provided that more than three stages may be kept for extremely important matters such as Cabinet notes and policy decisions: Provided further that files of existing policies or orders requiring clarification or instructions to regional offices will not be submitted at a level higher than the rank of Secretary: Provided also that reminders will not be submitted to higher levels. (4) Files containing proposals for investments and infrastructure projects, files/proposals received by the advisory department for policy matters to be placed before the Cabinet will not be sent to junior officers or desks. In such matters, opinions or notes will be recorded at the Deputy Secretary or at least Under Secretary level. In exceptional circumstances, if Under Secretaries are not available, such files will be submitted through desk officers.",
    "8. Updating the list of officer levels. - (1) The concerned administrative department at the Secretariat level, the department head at the divisional level or district level, as the case may be, or the head of any other office will prepare the list of powers delegated to subordinate officers within three months of the publication of these rules, and thereafter such published list will be updated on 2nd May of every subsequent year, and this information will also be displayed in electronic form on the government's or department's website or portal.",
    "9. Maharashtra Government Gazette, Extraordinary Part One - Central Sub-Division, November 19, 2013 / Kartik 28, Shake 1935* (2) The head of the concerned administrative department at the Secretariat level will, in January and July of each year, take a random review of the work of offices or departments to ensure that each officer is properly and impartially using the powers delegated to them and that appropriate decisions are being made on matters falling within their jurisdiction. *8. Regarding acknowledgment of E-mails. - Acknowledgment of receipt of e-mails should be given by the concerned persons. If the received e-mail is not related to that office or department or desk, it should be sent to the concerned office or department or desk and the applicant should be informed via e-mail.",
    "10. Responsibility of each officer. - The primary responsibility for submitting matters on time and finally disposing of those matters within the time limit prescribed in the Act will be of each officer at the Secretariat level and the officer in charge of the office at the departmental or district or taluka level.",
    "11. Measures to be taken to control the progress of work of the desk or section. - The in-charge branch or desk or section officer will monitor the progress of work being carried out in their branch or desk or section and ensure the following: (a) No reference or file or matter is overlooked or pending due to lack of action; (b) Personally taken action on complex and important references; (c) Examined the notes and drafts submitted to them and recorded their opinions or suggestions wherever necessary before submitting those notes and drafts to the competent authority, with the aim of ensuring accuracy in the notes and drafts; (d) Disposed as many matters as possible by taking initiative and responsibility; (e) Adopted appropriate and suitable measures so that references or matters are disposed of; (f) Kept informed of the daily work of the branch or desk; (g) For the purpose of strictly monitoring the progress of work of the branch or desk, taken a detailed analytical review of pending files in the branch or desk at the end of each month and provided proper guidance and appropriate corrective measures to dispose of pending files; (h) Records of the branch or desk will be kept as follows: (one) Incoming postal, (two) Matters under process, (three) Pending matters, (four) Dormant matters, (five) Standing order matters or compilations, and (six) Finally disposed matters (according to categories A, B, C, D); The officer in charge of the desk or branch or section should remain vigilant regarding the implementation of the rules.",
    "12. Restrictions to avoid delay in inter-departmental references. - To avoid delay in informal references or matters between Secretariat departments, action will be taken as follows: (a) Except for the Finance Department and the Law and Judiciary Department, all matters or references that need to be sent to other departments for opinion or consultation will be directly marked to the concerned Joint Secretary/Deputy Secretary/Under Secretary and their opinions will be sought. For this purpose, each department will prepare a list of names of the concerned Joint Secretary, Deputy Secretary, and Under Secretary of the department and the subjects related to them. Such a list will be made available to each department. Such a list will also be made available on the government's website. If there are any changes in the said list, necessary corrections will be made from time to time, and the list will also be displayed in a conspicuous place in the concerned desk. This information will also be displayed in electronic form on the government's or department's website or portal.",
    "13. Maharashtra Government Gazette, Extraordinary Part One - Central Sub-Division, November 19, 2013 / Kartik 28, Shake 1935* (b) If the proposal has been approved at the level of the Secretary of another department, such proposal will be scrutinized at the level of the Joint Secretary or Deputy Secretary of the Finance Department or Planning Department or General Administration Department, and there will be no objection to rejecting it at the Joint Secretary or Deputy Secretary level: Provided that for such purpose, the Secretary of that department must issue such order; (c) If the Secretary of that department does not agree with the opinions given by the Joint Secretary or Deputy Secretary of the Finance Department or Planning Department or General Administration Department, such file will be sent back to the Finance Department or Planning Department or General Administration Department, as the case may be, for review at the Secretary level. (d) If a proposal has been sent forward by another department at the Secretary level according to clause (g) above, and the Finance Department or Planning Department or General Administration Department wishes to reject such proposal, such rejection will be done at the Secretary level of the Finance Department or Planning Department or General Administration Department, as the case may be. (e) After the opinion of another department has been recorded and the matter is received back by the original department, if differences of opinion are found, instead of writing more notes on this matter, the Secretaries of both departments or the officers to whom powers have been delegated will personally discuss the disputed question and dispose of the matter by mutual consent. (f) If the original department wants to mark a file to more than one department, the file will be submitted to those departments in the same order in which the original department marked it. (g) If adoption of the procedure prescribed in clause (f) above is likely to cause delay in disposing of the matter, and if the opinions expected from the departments are unlikely to be supportive or are inconsistent or contradictory with the opinions of the original department, the original department will prepare a separate proposal and forward the file to each concerned department separately, seeking their opinions or views. (h) If the department is of the opinion that a particular matter received in its branch or desk is related to another department, the department will specify clearly the exact entry of the Maharashtra Government's Rules of Business to which this subject is related and, after obtaining the consent of the Secretary of that concerned department, send this matter to the concerned department. (i) If a question arises whether action on correspondence received by a department should be taken by that department or by any other department, both departments will discuss and resolve such question. If this question is not resolved within one week, a decision on that question will be taken by the Organization and Methods Branch of the General Administration Department, and once a decision is made at the level of the Secretary of the Organization and Methods (O&M) Branch of the General Administration Department, it will be final unless there are any other directions from the Chief Secretary or Hon. Chief Minister. If such a question regarding handling of a subject arises in any office other than a Secretariat department, this matter will be referred by the department heads within two working days to the concerned Secretary of the Secretariat department. (j) Even if the question of transferring a subject from one department to another is under consideration, the department that received the correspondence will continue to handle the subject related to it until a decision is made on the question of transferring it to another department. In such matters, a separate proposal for transferring the subject will be made by that department. (k) While creating informal references to other departments for matters of investment and infrastructure projects, such matters will not be forwarded like other general matters. Doubts will be resolved through discussion at the Secretary level or at least Under Secretary level, and notes will be made after obtaining agreement through initial procedure, so that time is not wasted in repeatedly writing and submitting notes. A control register for matters received regarding investment and infrastructure projects will be maintained in the office of the Secretary of the Secretariat department as well as in other offices through the Secretary's personal assistant or, as the case may be, the department head, and on either the first or last day of the week, the Secretary of the department or department head will review the disposal or implementation of such matters based on this control register.",
    "14. Maharashtra Government Gazette, Extraordinary Part One - Central Sub-Division, November 19, 2013 / Kartik 28, Shake 1935 12. Procedure for seeking opinions or views from subordinate offices. - If a Secretariat department or department head or district-level office finds it necessary to seek opinions or consult subordinate offices, the following procedure will be followed: (a) Generally, documents of matters will not be sent to officers in subordinate offices unless absolutely necessary. Preference will be given to using e-mail service for such correspondence, and sending reminders by e-mail will also be mandatory. (b) When documents of matters or the entire matter is sent to a subordinate office, the specific points on which consultation or opinion is expected from the officer in the subordinate office will be clearly and categorically mentioned. (c) The concerned officer of the subordinate office will give a clear opinion or views on the points specified for seeking opinion or consultation, elaborating related and relevant points concerning the matter. (d) The officer from whom opinion is sought will suggest an appropriate course of action or give an opinion or express views based on the specified situation in that particular matter. (e) The subordinate office will cite relevant laws, rules, and government administrative orders, etc., in support of its recommendations on a matter. (f) In matters where information has been sought from subordinate or field officers, the specific date by which the information is expected will be mentioned in the letter sent by the Secretariat department. The specified time limit for the subordinate or field office to submit the required information will be determined considering the scope of the information, the working days likely required to collect information from offices subordinate to that department or district-level office, and the time required to actually send that information. *13. Measures for making final decisions on matters within prescribed time limit. - The time limit prescribed under Section 10 of the Act for disposal of matters is maximum, and matters will be disposed within that time limit. The following measures will be taken to avoid delay regarding such matters: (a) The standards set for the work of government employees will be used to review whether the office work assigned to them is being disposed of properly or not. This periodic review will be done by each office head or department head or any other officer authorized in this regard by the end of each month. If such standards are not specified, they will be promptly specified by each office head or department head. (b) For making decisions on matters, wherever possible, powers will be delegated to each office or department head under the administrative control of Secretariat departments, and periodic review will be done of how effectively these delegated powers are being used, and necessary measures will be taken in this regard. (c) The procedure specified for taking action on matters for final decision will be reviewed and improved if necessary. *14. Determining matters mentioned in Section 11 of the Act and preparing a list. - The concerned administrative department at the Secretariat level and the department head at the divisional level or, as the case may be, the district office head at the district level will prepare a list of matters or subjects that fall under Section 11, to which the provisions of Section 10 of the Act will not apply in specific circumstances, and"
  ];

  const responsibilitiesList = [
    "Provide acknowledgment of the received application and record it in the information application register.",
    "Clarity regarding the requested information.",
    "Inform the applicant if the requested information is extensive, old, and will take time to find and prepare.",
    "As per Section 2(r), if the information is old, vague, and extensive, inform about viewing the records.",
    "If you are taking help from an Assistant Public Information Officer as per Section 5(4), inform the applicant of the letter's copy.",
    "If the information is available and definite, calculate the fee and inform for payment.",
    "If the requested information belongs to a third party, issue a notice to the third party and wait 10 days for their clarification/statements.",
    "If the information is providable, provide it in the same form as it is as per Section 7(9).",
    "If the requested information is old and cannot be photocopied, it can be denied by providing inspection.",
    "If information is not provided within 30 days and requested by the applicant in person, provide acknowledgment on the filed application.",
    "Give a reasoned decision when denying information under Sections 8 and 9.",
    "If documents are available from the questions raised in the applicant's application, provide them.",
    "If the information is old, extensive, and will take time to collect, inform the applicant within the first 5 days.",
    "If the applicant has requested information by post, calculate total amount including information fee and extra postage and inform for payment, and preserve the acknowledgment proof in records.",
    "If the requested information belongs to another public authority, send the applicant's application to the appropriate authority and give a copy of the letter to the applicant.",
  ];

  const pageContent = (
    <>
      <View style={styles.content}>
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{rtiCopy.badge}</Text>
          </View>
        </View>

        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{rtiCopy.headerTitle}</Text>
          <Text style={styles.headerDescription}>{rtiCopy.headerDescription}</Text>
        </View>

        <View style={[styles.twoColumnContainer, isMobile && styles.twoColumnContainerMobile]}>
          <View style={[styles.contentsCard, isMobile && styles.contentsCardMobile]}>
            <View style={styles.contentsHeader}>
              <View style={styles.contentsIcon}>
                <Text style={styles.contentsIconText}>📚</Text>
              </View>
              <Text style={styles.contentsTitle}>{rtiCopy.contentsTitle}</Text>
            </View>
            {contentsItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  // Scroll to section
                }}
              >
                <Text style={styles.contentsItem}>
                  {index + 1}. {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.infoCard, isMobile && styles.infoCardMobile]}>
            <Text style={styles.infoSubtitle}>{rtiCopy.infoSubtitle}</Text>
            <Text style={styles.infoTitle}>{rtiCopy.infoTitle}</Text>
            <Text style={styles.infoDescription}>{rtiCopy.infoDescription}</Text>
          </View>
        </View>

        <View style={[styles.bottomSplitContainer, isMobile && styles.bottomSplitContainerMobile]}>
          <View style={[styles.faqContainer, isMobile && styles.faqContainerMobile]}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqTitle}>{rtiCopy.faqTitle}</Text>
            </View>

            {faqData.map((faq) => (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={[styles.faqQuestion, openId === faq.id && styles.faqQuestionActive]}
                  onPress={() => toggle(faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqQuestionContent}>
                    <Text style={styles.faqQuestionLabel}>{rtiCopy.questionLabel} {faq.id}</Text>
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  </View>
                  <View style={styles.faqToggleIcon}>
                    <Text style={styles.faqToggleIconText}>
                      {openId === faq.id ? "−" : "+"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {openId === faq.id && (
                  <View style={styles.faqAnswer}>
                    {faq.answer.map((para, i) => (
                      <Text key={i} style={styles.faqAnswerText}>
                        {para}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={[styles.responsibilityContainer, isMobile && styles.responsibilityContainerMobile]}>
            <View style={styles.responsibilityHeader}>
              <Text style={styles.responsibilityTitle}>{rtiCopy.responsibilitiesTitle}</Text>
              <Text style={styles.responsibilitySubtitle}>{rtiCopy.responsibilitiesSubtitle}</Text>
            </View>

            <View style={styles.responsibilityList}>
              {responsibilitiesList.map((item, index) => (
                <View key={index} style={styles.responsibilityItem}>
                  <View style={styles.responsibilityNumber}>
                    <Text style={styles.responsibilityNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.responsibilityItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.legalSection}>
          {legalParagraphs.map((para, idx) => (
            <CollapsibleLegalText
              key={idx}
              readMoreLabel={rtiCopy.readMore}
              showLessLabel={rtiCopy.showLess}
            >
              {para}
            </CollapsibleLegalText>
          ))}
        </View>
      </View>
      <AppFooter navigation={navigation} />
    </>
  );

  const page = (
    <View style={{ flex: 1 }}>
      {isWeb ? <AppNavbar navigation={navigation} activeScreen="WhatIsRTI" /> : null}
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {pageContent}
      </ScrollView>
      {!isWeb && <AppNavbar navigation={navigation} activeScreen="WhatIsRTI" />}
    </View>
  );
  return isWeb ? <WebLayout>{page}</WebLayout> : page;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 32,
  },
  badgeContainer: {
    marginBottom: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 3,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      default: {
        elevation: 1,
      }
    }),
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#dc2626',
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 3,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 3,
      }
    }),
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    color: '#111827',
    marginBottom: 16,
  },
  headerDescription: {
    fontSize: 14,
    lineHeight: 24,
    color: '#4b5563',
  },
  twoColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 32,
  },
  twoColumnContainerMobile: {
    flexDirection: 'column',
    gap: 16,
  },
  contentsCard: {
    flex: 1,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 3,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      default: {
        elevation: 1,
      }
    }),
  },
  contentsCardMobile: {
    marginBottom: 0,
  },
  contentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  contentsIcon: {
    width: 40,
    height: 40,
    borderRadius: 3,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentsIconText: {
    fontSize: 18,
    color: 'white',
  },
  contentsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flexShrink: 1,
  },
  contentsItem: {
    fontSize: 14,
    color: '#374151',
    paddingVertical: 8,
    paddingLeft: 8,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 3,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 3,
      }
    }),
  },
  infoCardMobile: {
    marginTop: 0,
  },
  infoSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#fed7aa',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
    color: 'white',
    marginBottom: 16,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 24,
    color: '#fef2f2',
  },
  bottomSplitContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  bottomSplitContainerMobile: {
    flexDirection: 'column',
    gap: 16,
  },
  faqContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  faqContainerMobile: {
    marginBottom: 0,
  },
  faqHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  faqQuestionActive: {
    backgroundColor: '#fff7ed',
  },
  faqQuestionContent: {
    flex: 1,
    paddingRight: 12,
  },
  faqQuestionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#ef4444',
    marginBottom: 4,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 24,
    color: '#1f2937',
  },
  faqToggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 3,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  faqToggleIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  faqAnswer: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 32,
    color: '#374151',
    marginBottom: 12,
  },
  responsibilityContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 3,
    padding: 24,
  },
  responsibilityContainerMobile: {
    marginTop: 0,
  },
  responsibilityHeader: {
    marginBottom: 24,
  },
  responsibilityTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  responsibilitySubtitle: {
    fontSize: 14,
    lineHeight: 24,
    color: '#374151',
    textAlign: 'center',
  },
  responsibilityList: {
    backgroundColor: 'white',
    borderRadius: 3,
    padding: 16,
  },
  responsibilityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 3,
    marginBottom: 8,
  },
  responsibilityNumber: {
    width: 24,
    height: 24,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  responsibilityNumberText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  responsibilityItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 24,
    color: '#374151',
  },
  legalSection: {
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    padding: 16,
    width: '100%',
  },
  legalContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 3,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 12,
  },
  legalText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 28,
    color: '#14532d',
  },
  legalTextFull: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 28,
    color: '#14532d',
  },
  readMoreButton: {
    fontWeight: '500',
    color: '#15803d',
    textDecorationLine: 'underline',
  },
});
