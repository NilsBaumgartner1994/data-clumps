import {SoftwareProjectDicts} from "../SoftwareProject";
import {DetectorDataClumpsMethods} from "./DetectorDataClumpsMethods";
import {DetectorDataClumpsFields} from "./DetectorDataClumpsFields";
import {DataClumpsTypeContext} from "data-clumps-type-context";
import {Timer} from "../Timer";

const defaultValueField = "defaultValue";

type DetectorOptionInformationParameter = {
    label: string;
    description: string;
    [defaultValueField]: any
    group: any;
    type: any;
}

export class DetectorOptionsInformation {
    /**
     * Fields
     */
    public static typeVariablesConsidered: DetectorOptionInformationParameter = {
        label: "Types Variables Considered",
        description: "In Java Generics like: List<T> have a variable Type. On the other hand List<Number> has not (type argument). Default value is false, so variable types will not be considered.",
        defaultValue: false,
        group: "all",
        type: "boolean"
    }

    public static sharedFieldParametersMinimum: DetectorOptionInformationParameter = {
        label: "Minimum Number of Shared Fields",
        description: "The minimum number of fields that two or more classes must share to be considered related. Default value is 3.",
        defaultValue: 3,
        group: "field",
        type: "number"
    }
    public static sharedFieldParametersCheckIfAreSubtypes: DetectorOptionInformationParameter = {
        label: "Check Subtyping of Shared Fields",
        description: "If set to true, the detector will check if shared fields in related classes are subtypes of each other. Default value is false.",
        defaultValue: false,
        group: "field",
        type: "boolean"
    }
    public static subclassInheritsAllMembersFromSuperclass: DetectorOptionInformationParameter = {
        label: "Subclass Inherits All Members",
        description: "If set to true, the detector will consider a subclass related to its superclass only if it inherits all members fields from it. Default value is false.",
        defaultValue: false,
        group: "field",
        type: "boolean"
    }

    /**
     * Methods
     */
    public static sharedMethodParametersMinimum: DetectorOptionInformationParameter = {
        label: "Minimum Number of Shared Method Parameters",
        description: "The minimum number of method parameters that two or more classes must share to be considered related. Default value is 3.",
        defaultValue: 3,
        group: "method",
        type: "number"
    }
    public static sharedMethodParametersHierarchyConsidered: DetectorOptionInformationParameter = {
        label: "Consider Hierarchy for Shared Method Parameters",
        description: "If set to true, the detector will consider the hierarchy of classes when checking for shared method parameters. Default value is false.",
        defaultValue: false,
        group: "method",
        type: "boolean"
    }
    public static analyseMethodsWithUnknownHierarchy: DetectorOptionInformationParameter = {
        label: "Analyze Methods with Unknown Hierarchy",
        description: "If set to true, the detector will analyze methods that are not part of a known hierarchy of related classes. Default value is false.",
        defaultValue: false,
        group: "method",
        type: "boolean"
    }
}

export type DetectorOptions = {
    [K in keyof typeof DetectorOptionsInformation]: any;
};



function getDefaultValuesFromPartialOptions(partialOptions: Partial<DetectorOptions>): DetectorOptions{
    // @ts-ignore
    let result: DetectorOptions = {}

    let DetectorOptionsKeys = Object.keys(DetectorOptionsInformation);
    //console.log(DetectorOptionsKeys)

    for (const key of DetectorOptionsKeys) {
        const attributeKey = key;

        if (DetectorOptionsInformation.hasOwnProperty(attributeKey)) {
            const parameter: DetectorOptionInformationParameter = DetectorOptionsInformation[attributeKey];

            if (partialOptions.hasOwnProperty(attributeKey)) {
                result[attributeKey] = partialOptions[attributeKey]!;
            } else if (parameter.hasOwnProperty(defaultValueField)) {
                result[attributeKey] = parameter[defaultValueField];
            }
        } else {
            result[attributeKey] = "";
        }
    }

    return result;
}

export class Detector {

    public options: DetectorOptions;
    public softwareProjectDicts: SoftwareProjectDicts;
    public timer: Timer;
    public progressCallback: any;
    public target_language: string;
    public project_name: string;
    public project_version: string | null;
    public project_commit: string | null;
    public additional: any;
    public detector_version: string;

    static getDefaultOptions(options?: Partial<DetectorOptions>){
        return getDefaultValuesFromPartialOptions(options || {});
    }

    public constructor(softwareProjectDicts: SoftwareProjectDicts,
                       options: Partial<DetectorOptions> | null,
                       progressCallback: any,
                       project_name: string | null,
                       project_version: string | null,
                       project_commit: string | null,
                       detector_version?: string,
                       additional?: any,
                       target_language?: string,
    ){
        this.options = Detector.getDefaultOptions(options || {});
        this.softwareProjectDicts = softwareProjectDicts;
        this.timer = new Timer();
        this.progressCallback = progressCallback;

        this.target_language = target_language || "unknown";
        this.project_name = project_name || "unknown";
        this.project_version = project_version || "unknown";
        this.project_commit = project_commit || "unknown";
        this.additional = additional || {};
        this.detector_version = detector_version || "0.1.94";
    }

    public async detect(): Promise<DataClumpsTypeContext>{
        this.timer.start();

        let dataClumpsTypeContext: DataClumpsTypeContext = {
            report_version: "0.1.93",
            report_timestamp: new Date().toISOString(),
            target_language: this.target_language || "unkown",
            report_summary: {},
            project_info: {
                project_name: this.project_name,
                project_version: this.project_version,
                project_commit: this.project_commit,
                additional: this.additional,
            },
            detector: {
                name: "NilsBaumgarnter1994/data-clumps-doctor",
                version: this.detector_version,
                options: JSON.parse(JSON.stringify(this.options))
            },
            data_clumps: {}
        };

        console.log("Detecting software project for data clumps");
        //console.log(softwareProjectDicts);
        let detectorDataClumpsMethods = new DetectorDataClumpsMethods(this.options, this.progressCallback);
        let commonMethodParameters = await detectorDataClumpsMethods.detect(this.softwareProjectDicts);
        if(!!commonMethodParameters){
            let commonMethodParametersKeys = Object.keys(commonMethodParameters);
            for (let commonMethodParametersKey of commonMethodParametersKeys) {
                let commonMethodParameter = commonMethodParameters[commonMethodParametersKey];
                dataClumpsTypeContext.data_clumps[commonMethodParameter.key] = commonMethodParameter;
            }
        }

        let detectorDataClumpsFields = new DetectorDataClumpsFields(this.options, this.progressCallback);
        let commonFields = await detectorDataClumpsFields.detect(this.softwareProjectDicts);
        if(!!commonFields){
            let commonFieldsKeys = Object.keys(commonFields);
            for (let commonFieldsKey of commonFieldsKeys) {
                let commonField = commonFields[commonFieldsKey];
                dataClumpsTypeContext.data_clumps[commonField.key] = commonField;
            }
        }


        dataClumpsTypeContext.report_summary = {
            amount_data_clumps: Object.keys(dataClumpsTypeContext.data_clumps).length
        };

        // timeout for testing

        this.timer.stop();

        console.log("Detecting software project for data clumps (done)")
        this.timer.printElapsedTime("Detector.detect");


        return dataClumpsTypeContext;
    }

}
