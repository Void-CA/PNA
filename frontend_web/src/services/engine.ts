// services/engine.ts
import init, { GradeEngine } from "../../pkg/pkg.js";

let ready = false;

export async function initEngine() {
    if (!ready) {
        await init();
        ready = true;
    }
}

export function createEngine(bytes: Uint8Array) {
    if (!ready) {
        throw new Error("Engine not initialized");
    }
    return new GradeEngine(bytes);
}

/**
 * GradeEngine
 * 
 * This class comes from a WebAssembly (WASM) module and acts as the main interface
 * to interact with the grade data. It exposes the class table and computed summaries.
 * 
 * Usage example:
 * 
 * ```ts
 * import { GradeEngine } from "../pkg/pkg.js";
 * 
 * const engine = new GradeEngine(csvBytes); // csvBytes is Uint8Array
 * const summary = engine.get_summary();     // JSON summary of class
 * const table = engine.get_table();         // JSON table of scores
 * ```
 * 
 * Methods:
 * 
 * 1. get_summary(): Returns a summary of the class in JSON format.
 * 
 *    Structure:
 *    {
 *      class: {
 *        student_count: number,       // Total number of students
 *        overall_average: number,     // Class average score
 *        overall_std_dev: number,     // Standard deviation of student averages
 *        approved_count: number,      // Number of students with status "Approved"
 *        at_risk_count: number,       // Number of students with status "AtRisk"
 *        failed_count: number         // Number of students with status "Failed"
 *      },
 *      students: [
 *        {
 *          id: string,               // Student index
 *          name: string,             // Student name
 *          average: number | null,   // Average score of student
 *          percentile: number | null,// Percentile rank of student in class
 *          std_dev: number | null,   // Standard deviation of student scores
 *          status: "Approved" | "AtRisk" | "Failed"
 *        },
 *        ...
 *      ],
 *      evaluations: [
 *        {
 *          id: string,               // Evaluation index
 *          name: string,             // Evaluation name
 *          average: number | null,   // Average score of this evaluation
 *          std_dev: number | null,   // Standard deviation of this evaluation
 *          highest_score: number | null, // Highest score
 *          lowest_score: number | null,  // Lowest score
 *          evaluated_count: number,      // Number of students evaluated
 *          missing_count: number         // Number of missing scores
 *        },
 *        ...
 *      ]
 *    }
 * 
 * 2. get_table(): Returns the raw grade table in JSON format.
 * 
 *    Structure:
 *    {
 *      students: string[],         // Array of student names
 *      evaluations: string[],      // Array of evaluation names
 *      scores: (number | null)[][] // 2D array of scores: [student][evaluation]
 *    }
 * 
 * Notes:
 * - Use get_summary() for building dashboards, charts, or quick analysis.
 * - Use get_table() if you need access to the raw scores for detailed comparisons or
 *   cross-analysis in the frontend.
 * - All methods return JSON-compatible objects; you can pass them directly to React state
 *   or charting libraries.
 */
