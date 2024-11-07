import memoizeOne from 'memoize-one';
import {
	ELocationType,
	type ICourseFromAPI,
	IInstructorFromAPI,
	type ISectionFromAPI,
	type ISectionFromAPIWithSchedule
} from './api-types';
import parseCreditsFilter from './parse-credits-filter';

export const qualifiers = ['subject', 'level', 'has', 'credits', 'id', 'instructor'];

const generateArrayFromRange = memoizeOne((low: number, high: number): number[] => {
	const result = [];

	for (let i = low; i <= high; i++) {
		result.push(i);
	}

	return result;
});

export const filterCourse = (tokenPairs: Array<[string, string]>, course: ICourseFromAPI) => {
	for (const pair of tokenPairs) {
		const qualifier = pair[0];
		const value = pair[1];

		switch (qualifier) {
			case 'subject': {
				if (!(course.subject.toLowerCase() === value.toLowerCase())) {
					return false;
				}

				break;
			}

			case 'level': {
				let min = 0;
				let max = 0;

				if (value.includes('-')) {
					const fragments = value.split('-');
					min = Number.parseFloat(fragments[0]);
					max = Number.parseFloat(fragments[1]);
				} else if (value.includes('+')) {
					const fragments = value.split('+');
					min = Number.parseFloat(fragments[0]);
					max = Number.MAX_SAFE_INTEGER;
				} else {
					min = Number.parseFloat(value);
					max = (Math.floor((min + 1000) / 1000) * 1000) - 1; // Math.ceil((min + 0.1) / 1000) * 1000;
				}

				const courseLevel = Number.parseInt(course.crse, 10);
				const shouldInclude = min <= courseLevel && courseLevel <= max;

				if (!shouldInclude) {
					return false;
				}

				break;
			}

			default: {
				break;
			}
		}
	}

	return true;
};

// 3 states: MATCHED, NOMATCH, REMOVE
export type TQualifierResult = 'MATCHED' | 'NOMATCH' | 'REMOVE';

export const filterSection = (
	tokenPairs: Array<[string, string]>,
	section: ISectionFromAPIWithSchedule,
	instructor : IInstructorFromAPI, // I added
	isSectionScheduleCompatibleMap: Map<ISectionFromAPI['id'], boolean>,
): TQualifierResult => {
	let result: TQualifierResult = 'NOMATCH';

	for (const pair of tokenPairs) {
		// Short circuit
		if (result === 'REMOVE') {
			return result;
		}

		const qualifier = pair[0];
		const value = pair[1];

		switch (qualifier) {
			case 'id': {
				result = section.id === value ? 'MATCHED' : 'REMOVE';

				break;
			}

			case 'has': {
				if (value === 'seats') {
					result = section.availableSeats <= 0 ? 'REMOVE' : 'MATCHED';
				} else if (value === 'time') {
					result = (section.parsedTime?.firstDate) ? 'MATCHED' : 'REMOVE';
				}

				break;
			}

			case 'is': {
				switch (value) {
					case 'compatible': {
						result = isSectionScheduleCompatibleMap.get(section.id) ? 'MATCHED' : 'REMOVE';
						break;
					}

					case 'remote': {
						result = section.locationType === ELocationType.REMOTE ? 'MATCHED' : 'REMOVE';
						break;
					}

					case 'online': {
						result = section.locationType === ELocationType.ONLINE ? 'MATCHED' : 'REMOVE';
						break;
					}

					case 'classroom': {
						result = section.locationType === ELocationType.PHYSICAL ? 'MATCHED' : 'REMOVE';
						break;
					}

					default: {
						break;
					}
				}

				break;
			}

			case 'credits': {
				const [min, max] = parseCreditsFilter(value);

				if (!Number.isNaN(min) && !Number.isNaN(max)) {
					for (const possibleCredit of generateArrayFromRange(section.minCredits, section.maxCredits)) {
						if (min <= possibleCredit && possibleCredit <= max) {
							result = 'MATCHED';
						}
					}
					console.log("Test One")
					if (result !== 'MATCHED') {
						result = 'REMOVE';
					}
				}

				break;
			}
			//Below is what I'm trying to add
			case 'instructor': {
				let instructorID = section.instructors;
				result = 'REMOVE'
				for (let instructor of instructorID){
					/**if (value === instructor.id){
						for (let i = 0; i<instructorID.length; i++){
							if(instructor.id === instructorID[i].id){
								result = 'MATCHED';
								break;
							}
						}
						break;
					}*/
				}
				break;
			}
			//Above is what I'm trying to add
			default: {
				break;
			}
		}
	}

	return result;
};
