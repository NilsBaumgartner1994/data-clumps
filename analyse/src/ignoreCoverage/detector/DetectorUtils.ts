import {SoftwareProjectDicts} from "../SoftwareProject";
import {Dictionary} from "../UtilTypes";
import {DataClumpsVariableFromContext, DataClumpsVariableToContext,} from "data-clumps-type-context";
import {ClassOrInterfaceTypeContext, MemberFieldParameterTypeContext, ParameterTypeContext} from "../ParsedAstTypes";

type ParameterPair = {
    parameterKey: string;
    otherParameterKey: string;
}

export class DetectorUtils {

    public static countCommonParameters(parameters: ParameterTypeContext[], otherParameters: ParameterTypeContext[]){
        let commonParameterKeys = DetectorUtils.getCommonParameterPairKeys(parameters, otherParameters);
        let amountCommonParameters = commonParameterKeys.length;
        return amountCommonParameters;
    }


    public static getCommonParameterPairKeys(parameters: ParameterTypeContext[], otherParameters: ParameterTypeContext[]){


        let commonParameterPairKeys: ParameterPair[] = [];
        for(let parameter of parameters){
            for(let otherParameter of otherParameters){
                if(parameter.isSimilarTo(otherParameter)){
                    let commonParameterPairKey = {
                        parameterKey: parameter.key,
                        otherParameterKey: otherParameter.key
                    }
                    commonParameterPairKeys.push(commonParameterPairKey);
                }
            }
        }
        return commonParameterPairKeys;
    }

    public static getCurrentAndOtherParametersFromCommonParameterPairKeys(commonFieldParameterPairKeys: ParameterPair[], currentClassParameters: ParameterTypeContext[], otherClassParameters: ParameterTypeContext[])
        :[Dictionary<DataClumpsVariableFromContext>, string]
    {
        let currentParameters: Dictionary<DataClumpsVariableFromContext> = {};

        let commonFieldParameterKeysAsKey = "";

        for(let commonFieldParameterPairKey of commonFieldParameterPairKeys){

            let currentFieldParameterKey = commonFieldParameterPairKey.parameterKey;
            for(let currentClassParameter of currentClassParameters){
                if(currentClassParameter.key === currentFieldParameterKey){
                    commonFieldParameterKeysAsKey += currentClassParameter.name;

                    let related_to_context: any | DataClumpsVariableToContext = null;

                    let otherFieldParameterKey = commonFieldParameterPairKey.otherParameterKey;
                    for(let otherClassParameter of otherClassParameters){
                        if(otherClassParameter.key === otherFieldParameterKey){

                            let related_to_parameter: DataClumpsVariableToContext = {
                                key: otherClassParameter.key,
                                name: otherClassParameter.name,
                                type: otherClassParameter.type,
                                modifiers: otherClassParameter.modifiers,
                                position: {
                                    startLine: otherClassParameter.position?.startLine,
                                    startColumn: otherClassParameter.position?.startColumn,
                                    endLine: otherClassParameter.position?.endLine,
                                    endColumn: otherClassParameter.position?.endColumn
                                }
                            }

                            related_to_context = related_to_parameter;
                        }
                    }

                    currentParameters[currentClassParameter.key] = {
                        key: currentClassParameter.key,
                        name: currentClassParameter.name,
                        type: currentClassParameter.type,
                        modifiers: currentClassParameter.modifiers,
                        to_variable: related_to_context,
                        position:{
                            startLine: currentClassParameter.position?.startLine,
                            startColumn: currentClassParameter.position?.startColumn,
                            endLine: currentClassParameter.position?.endLine,
                            endColumn: currentClassParameter.position?.endColumn
                        }
                    }
                }
            }


        }
        return [currentParameters, commonFieldParameterKeysAsKey];
    }

    public static getClassesDict(softwareProjectDicts: SoftwareProjectDicts){
        let classesOrInterfacesDict: Dictionary<ClassOrInterfaceTypeContext> = softwareProjectDicts.dictClassOrInterface;
        let classesDict: Dictionary<ClassOrInterfaceTypeContext> = {};
        let classOrInterfaceKeys = Object.keys(classesOrInterfacesDict);
        for (let classOrInterfaceKey of classOrInterfaceKeys) {
            let classOrInterface = classesOrInterfacesDict[classOrInterfaceKey];
            let type = classOrInterface.type; // ClassOrInterfaceTypeContext type is either "class" or "interface"
            if(type === "class"){ // DataclumpsInspection.java line 407
                classesDict[classOrInterfaceKey] = classOrInterface;
            }
        }
        return classesDict;
    }

}
