import {HiOutlineBuildingLibrary} from 'react-icons/hi2';
import {IoLibraryOutline} from 'react-icons/io5';
import {
	LuBookHeadphones,
	LuBookLock,
	LuSettings,
	LuUpload,
	LuBookAudio,
	LuHeadphones,
	LuMusic4,
	LuBadgeHelp,
	LuPlay,
	LuEllipsisVertical,
	LuStar,
	LuUserPlus,
	LuUser,
	LuUsers,
	LuFolderPlus,
	LuFolder,
	LuPlus,
	LuSearch,
	LuFolderSearch,
	LuTrash2,
	LuPencilLine,
	LuKeyRound,
	LuArrowRight,
	LuAudioLines,
	LuFileAudio,
	LuMic,
	LuSpeaker,
	LuBook,
	LuBookCheck,
	LuBookHeart,
	LuBookOpen,
	LuChevronRight,
	LuArrowLeft,
	LuX,
	LuFile,
	LuUserCog,
	LuChevronDown,
	LuCircleUserRound,
	LuArrowDown,
	LuArrowUp,
	LuArrowDownZA,
	LuArrowDownAZ,
	LuList,
	LuChevronLeft,
	LuPause,
	LuFastForward,
	LuGauge,
	LuListMusic,
	LuRewind,
	LuVolume2,
	LuArrowBigRightDash,
	LuArrowBigLeftDash,
	LuVolume1,
	LuVolumeOff,
	LuVolume,
	LuChevronsRight,
	LuChevronsLeft
} from "react-icons/lu";

// 图标映射
const iconMap = {
	setting: LuSettings,
	upload: LuUpload,
	ellipsisVertical: LuEllipsisVertical,
	star: LuStar,
	search: LuSearch,
	trash: LuTrash2,
	edit: LuPencilLine,

	book: LuBook,
	bookOpen: LuBookOpen,
	bookLock: LuBookLock,
	bookCheck: LuBookCheck,
	bookAudio: LuBookAudio,
	bookHeadphones: LuBookHeadphones,
	bookHeart: LuBookHeart,
	audioLines: LuAudioLines,
	audioFile: LuFileAudio,
	speaker: LuSpeaker,
	microphone: LuMic,
	headphone: LuHeadphones,
	music: LuMusic4,

	play: LuPlay,
	pause: LuPause,
	rewind: LuChevronsLeft,
	forward: LuChevronsRight,
	next: LuFastForward,
	prev: LuRewind,
	speed: LuGauge,
	volume: LuVolume2,
	volume0: LuVolume,
	volume1: LuVolume1,
	volume2: LuVolume2,
	playlist: LuListMusic,

	library: IoLibraryOutline,
	libraryBuilding: HiOutlineBuildingLibrary,
	libraryScan: LuFolderSearch,

	user: LuUser,
	users: LuUsers,
	userPlus: LuUserPlus,
	admin: LuUserCog,
	key: LuKeyRound,
	author: LuCircleUserRound,
	
	folder:	LuFolder,
	folderPlus: LuFolderPlus,
	file: LuFile,

	plus: LuPlus,
	arrowRight: LuArrowRight,
	arrowLeft: LuArrowLeft,
	arrowUp: LuArrowUp,
	arrowDown: LuArrowDown,
	chevronLeft: LuChevronLeft,
	chevronRight: LuChevronRight,
	chevronDown: LuChevronDown,
	sortAsc: LuArrowDownAZ,
	sortDesc: LuArrowDownZA,
	x: LuX,
	list: LuList,
	toc: LuList,
};

// 获取所有可用的图标名称
export type IconName = keyof typeof iconMap;

interface MyIconProps {
	iconName: IconName;
	className?: string;
}

export default function MyIcon({
	iconName: name,
	className = "w-[1.5em] h-[1.5em]"
} : MyIconProps) {
	const Icon = iconMap[name];
	if (! Icon) {
		return <LuBadgeHelp className="text-red-500 w-[1.5em] h-[1.5em]" />;
	}
	return <Icon className={className} />;
}
