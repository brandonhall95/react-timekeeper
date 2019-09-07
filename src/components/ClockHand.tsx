import React, { useEffect, useRef } from 'react'
import { animated, useSpring } from 'react-spring'

import { Time } from '../helpers/types'
import { getTimeValue, isHourMode, isSameTime } from '../helpers/utils'
import {
	CLOCK_SIZE,
	CLOCK_RADIUS,
	NUMBER_OUTER_POSITION,
	MODE,
	CLOCK_VALUES,
	getClockHandCirclePosition,
	getClockHandCircleRadius,
	getClockHandLength,
} from '../helpers/constants'
import {
	CLOCK_HAND_ARM as CLOCK_HAND_ARM_FILL,
	CLOCK_HAND_CIRCLE_BACKGROUND,
	CLOCK_HAND_INTERMEDIATE_CIRCLE_BACKGROUND,
} from './styles/constants'
import useConfig from '../hooks/config-context'
import { calcAnimationAngle } from '../helpers/math'

interface Props {
	mode: MODE
	time: Time
}

function rotate(r: number) {
	return `rotate(${r} ${CLOCK_RADIUS} ${CLOCK_RADIUS})`
}

function getAngle(mode: MODE, time: Time) {
	const increments = CLOCK_VALUES[mode].increments
	const value = getTimeValue(mode, time)
	return value * (360 / increments)
}

export default function ClockHand({ mode, time }: Props) {
	const config = useConfig()
	const prevState = useRef({ time, mode })
	const dragCount = useRef(0)

	// clockhand positioning
	const inner = time.hour > 0 && time.hour <= 12
	const handLength = getClockHandLength(mode, inner)
	const circlePosition = getClockHandCirclePosition(mode, inner)
	const circleRadius = getClockHandCircleRadius(mode, inner)

	const [anim, setAnim] = useSpring(() => {
		return {
			immediate: true,
			rotation: getAngle(mode, time),
			length: handLength,
			position: circlePosition,
		}
	})
	const { rotation, length, position } = anim

	useEffect(() => {
		const current = rotation.value
		const next = getAngle(mode, time)

		if (prevState.current.mode !== mode) {
			dragCount.current = 0
			prevState.current.mode = mode

			// mode changed, animate clockhand to next mode angle
			const finalAngle = calcAnimationAngle(current, next)
			setAnim({
				immediate: false,
				rotation: finalAngle,
				length: handLength,
				position: circlePosition,
			})
		} else if (!isSameTime(prevState.current.time, time)) {
			// time changed, no animation necessary - just update clockhand
			prevState.current.time = time
			dragCount.current++

			/*
			TODO - consider making this a config option?
			if on hour mode and `switchToMinuteOnHourSelect` is enabled, don't display
			change in time, just wait for mode to change
			*/
			// if (isHourMode(mode) && config.switchToMinuteOnHourSelect && dragCount.current < 2) {
			// 	return
			// }

			setAnim({
				immediate: true,
				rotation: next,
				length: handLength,
				position: circlePosition,
			})
		}
	}, [
		circlePosition,
		config.switchToMinuteOnHourSelect,
		handLength,
		mode,
		rotation,
		setAnim,
		time,
	])

	// mini circle on clockhand between increments on minutes
	const value = getTimeValue(mode, time)
	let showIntermediateValueDisplay
	if (mode === MODE.MINUTES && value % 5) {
		showIntermediateValueDisplay = (
			<circle
				cx={CLOCK_RADIUS}
				cy={NUMBER_OUTER_POSITION}
				r={4}
				fill={CLOCK_HAND_INTERMEDIATE_CIRCLE_BACKGROUND}
				className="react-timekeeper__hand-intermediate-circle"
			/>
		)
	}

	return (
		<svg
			width={CLOCK_SIZE}
			height={CLOCK_SIZE}
			viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}
			xmlns="http://www.w3.org/2000/svg"
			className="react-timekeeper__clock-hand"
			// style={{ overflow: 'visible' }}
		>
			<animated.g transform={rotation.interpolate((a) => rotate(a))}>
				<animated.line
					stroke={CLOCK_HAND_ARM_FILL}
					x1={CLOCK_RADIUS}
					y1={CLOCK_RADIUS}
					x2={CLOCK_RADIUS}
					y2={length}
					strokeWidth="1"
					className="react-timekeeper__clock-hand"
				/>
				<circle
					cx={CLOCK_RADIUS}
					cy={CLOCK_RADIUS}
					r={1.5}
					fill={CLOCK_HAND_ARM_FILL}
					className="react-timekeeper__hand-circle-center"
				/>
				<animated.circle
					fill={CLOCK_HAND_CIRCLE_BACKGROUND}
					cx={CLOCK_RADIUS}
					cy={position}
					r={circleRadius}
					className="react-timekeeper__hand-circle-outer"
				/>
				{showIntermediateValueDisplay}
			</animated.g>
		</svg>
	)
}
