import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
	Input,
	Container,
	InputGroup,
	InputLeftElement,
	Text,
	Kbd,
	Button,
	HStack,
	IconButton,
	Box,
	Fade,
	Modal,
	ModalOverlay,
} from '@chakra-ui/react';
import {CloseIcon, Search2Icon} from '@chakra-ui/icons';
import useHeldKey from 'src/lib/hooks/use-held-key';
import {observer} from 'mobx-react-lite';

type SearchBarProps = {
	innerRef?: React.Ref<HTMLDivElement>;
	children?: React.ReactElement;
	placeholder: string;
	isEnabled: boolean;
	onChange: (newValue: string) => void;
	value: string;
	rightButtons?: React.ReactElement | React.ReactElement[];
};

const DefaultSearchBar = observer((props: SearchBarProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const [showHelp, setShowHelp] = useState(false);
	const [isKeyHeld, handleKeydown] = useHeldKey({key: '/'});

	// Autofocus
	useEffect(() => {
		if (props.isEnabled) {
			inputRef.current?.focus();
		}
	}, [props.isEnabled]);

	useEffect(() => {
		if (isKeyHeld) {
			setShowHelp(true);
		} else {
			setShowHelp(false);
		}
	}, [isKeyHeld]);

	const handleShowHelp = useCallback(() => {
		setShowHelp(true);
	}, []);

	const handleModalClose = useCallback(() => {
		setShowHelp(false);
	}, []);

	return (
		<Container ref={props.innerRef} paddingX={{md: 0}}>
			<InputGroup boxShadow='md' borderRadius='md' size='lg'>
				<InputLeftElement pointerEvents='none'>
					<Search2Icon color='gray.300'/>
				</InputLeftElement>

				<Input
					ref={inputRef}
					autoFocus
					placeholder={props.placeholder}
					size='lg'
					value={props.value}
					aria-label='Search for courses or sections'
					disabled={!props.isEnabled}
					pr={props.rightButtons ? 20 : 12}
					onChange={event => {
						props.onChange(event.target.value);
					}}
					onKeyDown={handleKeydown}
				/>

				<Box
					pos='absolute'
					display='flex'
					justifyContent='center'
					alignItems='center'
					height='full'
					right={4}
					zIndex={10}
				>
					{props.value !== '' && (
						<Fade in>
							{props.rightButtons}

							<IconButton
								icon={<CloseIcon/>}
								aria-label='Clear query'
								rounded='full'
								size='xs'
								onClick={() => {
									props.onChange('');
								}}/>
						</Fade>
					)}
				</Box>
			</InputGroup>

			{props.children && (
				<HStack mt={3} w='100%' justifyContent='center' mb={{base: '0', md: '-45px'}}>
					<Text>
						hold <Kbd>/</Kbd> to see
					</Text>
					<Button size='sm' onClick={handleShowHelp}>available filters</Button>
				</HStack>
			)}

			<Modal isOpen={showHelp} size='2xl' onClose={handleModalClose}>
				<ModalOverlay/>
				{props.children}
			</Modal>
		</Container>
	);
});

export default DefaultSearchBar;
