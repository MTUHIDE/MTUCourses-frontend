import React from 'react';
import { Tooltip, Tag, type TagProps, type ThemingProps } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { type Schedule } from 'src/lib/rschedule';
import { DATE_DAY_CHAR_MAP } from 'src/lib/constants';
import useStore from "src/lib/state/context";
import { ISectionFromAPI } from "src/lib/api-types";

const padTime = (v: number) => v.toString().padStart(2, '0');

const DAYS_95_IN_MS = 95 * 24 * 60 * 60 * 1000;

export const getFormattedTimeFromSchedule = (schedule?: Schedule | undefined) => {
	let start = new Date();
	let end = new Date();

	const timeStringToDay: Record<string, string[]> = {};

	if (schedule) {
		const occurrences = schedule.collections({ granularity: 'week', weekStart: 'SU' }).toArray();

		if (occurrences.length > 0) {
			for (const d of occurrences[0].dates) {
				start = d.date;
				end = d.end ?? new Date();

				const timeForThisDay = `${padTime(start.getHours())}:${padTime(start.getMinutes())} 
                ${start.getHours() >= 12 ? 'PM' : 'AM'} - ${padTime(end.getHours())}:${padTime(end.getMinutes())} 
                ${end.getHours() >= 12 ? 'PM' : 'AM'}`;

				const dayChar = DATE_DAY_CHAR_MAP[start.getDay()];

				if (timeStringToDay[timeForThisDay]) {
					timeStringToDay[timeForThisDay].push(dayChar);
				} else {
					timeStringToDay[timeForThisDay] = [dayChar];
				}
			}
		}

		start = schedule.firstDate?.toDateTime().date ?? new Date();
		end = schedule.lastDate?.toDateTime().date ?? new Date();
	}

	const formattedStart = start.toLocaleDateString('en-US');
	const formattedEnd = end.toLocaleDateString('en-US');

	if (Object.keys(timeStringToDay).length > 0) {
		const sortedTimes = Object.keys(timeStringToDay).sort(
			(timeString1, timeString2) => timeStringToDay[timeString2].length - timeStringToDay[timeString1].length
		);

		const primaryTimeString = sortedTimes[0];
		const otherTimeStrings = sortedTimes.slice(1);

		let days = `${timeStringToDay[primaryTimeString].join('')}`;

		if (otherTimeStrings.length > 0) {
			for (const timeString of otherTimeStrings) {
				days += `/${timeStringToDay[timeString].join('')}`;
			}
		}

		const isHalf = (end.getTime() - start.getTime() < DAYS_95_IN_MS);

		let info = `${formattedStart} - ${formattedEnd} ${isHalf ? '(half semester)' : '(full semester)'}`;

		for (const timeString of sortedTimes) {
			info += `, ${timeString} on ${timeStringToDay[timeString].join('')}`;
		}

		info += ', EST';

		return {
			days,
			times: sortedTimes,
			start: formattedStart,
			end: formattedEnd,
			isHalf,
			info,
		};
	}

	return null;
};

// TimeDisplay component for showing the formatted schedule times
type TimeDisplayProps = {
	schedule?: Schedule | undefined;
	size?: TagProps['size'];
	colorScheme?: ThemingProps['colorScheme'];
	section?: ISectionFromAPI | undefined;
};

const TimeDisplay = observer((props: TimeDisplayProps) => {
	const { apiState } = useStore(); // Access the store

	const formattedTime = getFormattedTimeFromSchedule(props.schedule);

	if (!formattedTime) {
		return <>¯\_(ツ)_/¯</>; // Fallback for no formatted time
	}

	let additionalSectionsInfo: string[] = [];
	if(props.section){
		let section = apiState.sectionsWithParsedSchedules;
		for (let i = 0; i < section.length; i++) {
			if (section[i].id !== props.section?.id && section[i].courseId == props.section?.courseId) { // === get the course id from the section
				const otherFormattedTime = getFormattedTimeFromSchedule(section[i].parsedTime);
				if (otherFormattedTime) {
					additionalSectionsInfo.push(otherFormattedTime.info);
				}
			}
		}
	}

	const { days, times, isHalf, info } = formattedTime;
	let colorScheme = isHalf ? 'yellow' : 'green';

	if (props.colorScheme) {
		colorScheme = props.colorScheme;
	}

	return (
		<Tooltip
			label={
				<>
					<div>{info}</div>
					{additionalSectionsInfo.length > 0 && (
						<div style={{ marginTop: '0.5rem' }}>
							<strong>Other sections:</strong>
							<ul style={{ paddingLeft: '1rem', margin: '0.25rem 0' }}>
								{additionalSectionsInfo.map((sectionInfo, index) => (
									<li key={index}>{sectionInfo}</li>
								))}
							</ul>
						</div>
					)}
				</>
			}
			aria-label="Date range"
		>
			<Tag colorScheme={colorScheme} size={props.size}>
				<span style={{ minWidth: '4ch', display: 'inline-block', marginRight: '0.25rem' }}>{days}</span>
				<span>{times.join(', ')}</span>
			</Tag>
		</Tooltip>
	);
});

export default TimeDisplay;
