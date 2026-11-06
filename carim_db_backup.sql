-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: carim_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bankily`
--

DROP TABLE IF EXISTS `bankily`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bankily` (
  `operationId` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Unique operation identifier for Bankily',
  `clientPhone` varchar(255) NOT NULL DEFAULT '',
  `passcode` varchar(255) NOT NULL DEFAULT '',
  `id_transaction` varchar(255) NOT NULL DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`operationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bankily`
--

LOCK TABLES `bankily` WRITE;
/*!40000 ALTER TABLE `bankily` DISABLE KEYS */;
/*!40000 ALTER TABLE `bankily` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `image` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `driverId` int(11) DEFAULT NULL,
  `orderId` varchar(255) NOT NULL DEFAULT '',
  `status` enum('0','1','2','3','4','5','6') NOT NULL DEFAULT '0' COMMENT '0=>driver on the way,1=>arrived,2=>ride started,3=> completed,4=>cancel',
  `request` enum('0','1','2') NOT NULL DEFAULT '0',
  `otpbooking` varchar(255) NOT NULL DEFAULT '',
  `pickupLocation` varchar(255) NOT NULL DEFAULT '',
  `dropLocation` varchar(255) NOT NULL DEFAULT '',
  `pickupLatitude` varchar(255) NOT NULL DEFAULT '',
  `pickupLongitude` varchar(255) NOT NULL DEFAULT '',
  `dropLatitude` varchar(255) NOT NULL DEFAULT '',
  `dropLongitude` varchar(255) NOT NULL DEFAULT '',
  `numberOfPassenger` varchar(255) NOT NULL DEFAULT '',
  `rideType` enum('0','1') NOT NULL DEFAULT '0' COMMENT '0=>single ride,1=>pool ride',
  `bookingPrice` varchar(255) NOT NULL DEFAULT '',
  `paymentMethod` enum('0','1') NOT NULL DEFAULT '0' COMMENT '0=>cash,1=>online',
  `bookingDate` datetime NOT NULL DEFAULT current_timestamp(),
  `rideOpen` int(11) NOT NULL DEFAULT 0,
  `rejectCount` int(11) NOT NULL DEFAULT 0,
  `travelledDistance` varchar(255) NOT NULL DEFAULT '',
  `lastLatitude` varchar(255) NOT NULL DEFAULT '',
  `lastLongitude` varchar(255) NOT NULL DEFAULT '',
  `lastParkingMinutes` varchar(255) NOT NULL DEFAULT '',
  `totalParkingCharge` varchar(255) NOT NULL DEFAULT '',
  `lastUpdateTime` datetime DEFAULT NULL,
  `callerName` varchar(255) NOT NULL DEFAULT '',
  `callerCountryCode` varchar(255) NOT NULL DEFAULT '',
  `callerPhone` varchar(255) NOT NULL DEFAULT '',
  `adminAmountCut` varchar(255) NOT NULL DEFAULT '',
  `rideDistance` varchar(255) NOT NULL DEFAULT '',
  `startParkTime` varchar(255) NOT NULL DEFAULT '',
  `endParkTime` varchar(255) NOT NULL DEFAULT '',
  `rideStartTime` varchar(255) NOT NULL DEFAULT '',
  `totalPerMinuteCharge` varchar(255) NOT NULL DEFAULT '',
  `parkingActive` enum('0','1') NOT NULL DEFAULT '0',
  `lastPerMinuteCalculation` datetime NOT NULL DEFAULT current_timestamp(),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`) USING BTREE,
  KEY `driverId` (`driverId`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (2,3,NULL,'880613','5','0','','1600, 1600 Amphitheatre Pkwy, Mountain View, California, United States','Selected Destination','37.4219983','-122.084','37.41421870553878','-122.08694089204073','','0','100','0','2026-10-24 07:28:02',0,0,'','','','','',NULL,'','','','','0.9','','','','','0','2026-10-24 07:28:02','2026-10-24 07:28:02','2026-10-24 07:28:24',NULL),(3,3,NULL,'181160','5','0','','1600, 1600 Amphitheatre Pkwy, Mountain View, California, United States','Selected Destination','37.4219983','-122.084','37.39734258397532','-122.13124293833972','','0','250','0','2026-10-24 07:43:26',0,0,'','','','','',NULL,'','','','','5','','','','','0','2026-10-24 07:43:26','2026-10-24 07:43:26','2026-10-24 07:43:36',NULL),(4,3,7,'838503','5','1','','1600, 1600 Amphitheatre Pkwy, Mountain View, California, United States','Selected Destination','37.4219983','-122.084','37.41969039107435','-122.08704885095358','','0','100','0','2026-10-24 10:37:14',0,0,'','','','','',NULL,'','','','','0.37','','','','','0','2026-10-24 10:37:14','2026-10-24 10:37:14','2026-10-28 11:49:10',NULL),(5,3,NULL,'692785','5','0','','Current Location','Selected Destination','28.389042821465207','77.34959285706282','28.378260169174474','77.34450805932283','','0','100','0','2026-10-28 11:51:57',0,0,'','','','','',NULL,'','','','','1.3','','','','','0','2026-10-28 11:51:57','2026-10-28 11:51:57','2026-10-28 11:53:00',NULL),(6,3,NULL,'182036','5','0','','haryana','Selected Destination','28.38884962533376','77.31858618557453','','','','0','100','0','2026-10-28 11:54:56',1,0,'','','','','',NULL,'','','','','','','','','','0','2026-10-28 11:54:56','2026-10-28 11:54:56','2026-10-28 11:55:10',NULL),(7,8,NULL,'503055','5','0','','Vipul plaza, Vipul plaza, Sector 81, Faridabad, Haryana, India','Selected Destination','28.3889466','77.3488756','28.357014650392788','77.33084723353386','','0','200','0','2026-10-28 12:05:05',0,0,'','','','','',NULL,'','','','','3.97','','','','','0','2026-10-28 12:05:05','2026-10-28 12:05:05','2026-10-28 12:05:46',NULL),(8,8,NULL,'497294','6','2','','Vipul plaza, Vipul plaza, Sector 81, Faridabad, Haryana, India','Selected Destination','28.3889781','77.3487694','28.36341014212063','77.33797185122967','','0','150','0','2026-10-28 12:06:07',0,0,'','','','','',NULL,'','','','','3.04','','','','','0','2026-10-28 12:06:07','2026-10-28 12:06:07','2026-10-28 12:11:07',NULL),(9,8,NULL,'988961','5','0','','Vipul plaza, Vipul plaza, Sector 81, Faridabad, Haryana, India','Selected Destination','28.3888729','77.3488973','28.369545640085686','77.32949405908585','','0','145','0','2026-10-28 12:16:03',0,0,'','','','','',NULL,'','','','','2.87','','','','','0','2026-10-28 12:16:03','2026-10-28 12:16:03','2026-10-28 12:16:23',NULL),(10,8,NULL,'364967','5','0','','Vipul plaza, Vipul plaza, Sector 81, Faridabad, Haryana, India','Selected Destination','28.3889358','77.3487897','28.36840335566091','77.32682392001152','','0','155','0','2026-10-28 12:16:30',0,0,'','','','','',NULL,'','','','','3.14','','','','','0','2026-10-28 12:16:30','2026-10-28 12:16:30','2026-10-28 12:16:35',NULL),(11,8,6,'990040','3','1','','Vipul plaza, Vipul plaza, Sector 81, Faridabad, Haryana, India','Selected Destination','28.3889487','77.3487921','28.213556018732135','77.28067215532064','','0','1030','0','2026-10-28 12:16:42',0,0,'','','','','0','2026-10-28 12:17:29','','','','103','20.63','','','2026-10-28 17:47','0','0','2026-10-28 12:17:29','2026-10-28 12:16:42','2026-10-28 12:17:35',NULL),(12,8,6,'893759','3','1','','Vipul plaza, Vipul plaza, Sector 81, Faridabad, Haryana, India','Selected Destination','28.3889915','77.3486904','28.317512619529996','77.31961280107498','','0','425','0','2026-10-28 12:26:33',0,0,'','','','','0','2026-10-28 12:27:15','','','','42.5','8.45','','','2026-10-28 17:57','0','0','2026-10-28 12:27:15','2026-10-28 12:26:33','2026-10-28 12:27:19',NULL);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_constant`
--

DROP TABLE IF EXISTS `chat_constant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_constant` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL DEFAULT 0,
  `reciever_id` int(11) NOT NULL DEFAULT 0,
  `lastMessage_id` int(11) NOT NULL DEFAULT 0,
  `bookingId` int(11) NOT NULL DEFAULT 0,
  `deletedId` int(11) NOT NULL DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_constant`
--

LOCK TABLES `chat_constant` WRITE;
/*!40000 ALTER TABLE `chat_constant` DISABLE KEYS */;
INSERT INTO `chat_constant` VALUES (1,7,3,1,4,0,1,'2026-10-24 10:38:43','2026-10-24 10:38:43',NULL),(2,8,6,4,11,0,1,'2026-10-28 12:17:03','2026-10-28 12:17:15',NULL),(3,8,6,6,12,0,1,'2026-10-28 12:26:57','2026-10-28 12:27:01',NULL);
/*!40000 ALTER TABLE `chat_constant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cms`
--

DROP TABLE IF EXISTS `cms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) NOT NULL DEFAULT 1,
  `title` varchar(255) NOT NULL DEFAULT '',
  `content` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cms`
--

LOCK TABLES `cms` WRITE;
/*!40000 ALTER TABLE `cms` DISABLE KEYS */;
INSERT INTO `cms` VALUES (1,1,'Privacy Policy','<h2>Privacy Policy - Radhix Technologies</h2>\n<p>Welcome to Radhix Technologies. We are committed to protecting your privacy and ensuring your personal information is collected and used transparently and securely.</p>\n\n<h3>1. Information We Collect</h3>\n<p>We collect personal information such as your name, phone number, email address, and real-time location data when you use our mobile application and ride-booking services.</p>\n\n<h3>2. How We Use Your Information</h3>\n<ul>\n  <li>To facilitate ride requests and connect you with nearby drivers.</li>\n  <li>To calculate trip routes, fares, and arrival estimates.</li>\n  <li>To provide customer support and send service updates.</li>\n  <li>To improve our digital products and maintain platform safety.</li>\n</ul>\n\n<h3>3. Location Data</h3>\n<p>Our app requires location permissions in the background and foreground to track driver location and provide accurate pickup and drop services. Location data is never sold to third parties.</p>\n\n<h3>4. Data Security</h3>\n<p>We use industry-standard encryption and security protocols to safeguard your personal data against unauthorized access, loss, or disclosure.</p>\n\n<h3>5. Contact Us</h3>\n<p>If you have any questions about this Privacy Policy, please contact Radhix Technologies at support@radhix.com.</p>','2026-10-24 07:33:47','2026-10-24 07:33:47'),(2,2,'About Us','<h2><strong>Leading Digital Transformation Since 2019</strong></h2><p>Radhix Technologies is a digital and IT solutions partner for businesses ready to grow with confidence. We combine strategy, design and technology to create useful digital experiences that move brands forward in India and beyond.</p><p><br></p><h6><strong>Fast-Growing Agency</strong></h6><p>25+ projects delivered</p><p><br></p><h6><strong>Quality-First Delivery</strong></h6><p>Tested before every launch</p><h5><strong>Our Expertise</strong></h5><p><strong>Digital Marketing</strong></p><p>SEO, Social Media, PPC, Content Strategy</p><p><strong>Web Development</strong></p><p>Custom Websites, eCommerce, Web Applications</p><p><strong>Software Solutions</strong></p><p>Mobile Apps, ERP, CRM, AI Solutions</p><p><strong>IT Consulting</strong></p><p>Cloud, Cybersecurity, Automation</p><p><strong>Branding &amp; Design</strong></p><p>Logo, Identity, Marketing Materials</p><p><strong>Social Media Management</strong></p><p>Multi-platform growth strategies</p><p><br></p>','2026-10-24 07:33:47','2026-10-24 07:36:38'),(3,3,'Terms and Conditions','<h2>Terms and Conditions - Radhix Technologies</h2><p>Please read these Terms and Conditions carefully before using our application and ride-booking platform provided by Radhix Technologies.</p><h3>1. Acceptance of Terms</h3><p>By creating an account or accessing our services, you agree to be bound by these terms. If you do not agree, please do not use the service.</p><h3>2. User Accounts</h3><p>You must provide accurate and complete information during registration. You are responsible for keeping your login credentials confidential.</p><h3>3. Bookings and Fares</h3><ul><li>Trip fares are calculated based on base fare, distance, and time rates configured in the platform.</li><li>Cancellation fees may apply if a ride is cancelled after driver dispatch.</li><li>All payments must be completed through accepted payment methods.</li></ul><h3>4. User Conduct</h3><p>Users and drivers must behave respectfully. Any abusive, illegal, or unsafe behavior may result in immediate suspension or termination of your account.</p><h3>5. Limitation of Liability</h3><p>Radhix Technologies acts as a technology intermediary platform connecting riders with independent drivers and is not liable for indirect damages or delays.</p><h3>6. Changes to Terms</h3><p>We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of updated terms.</p>','2026-10-24 07:33:47','2026-10-24 07:36:47');
/*!40000 ALTER TABLE `cms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contactus`
--

DROP TABLE IF EXISTS `contactus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contactus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL DEFAULT '',
  `countryCode` varchar(20) NOT NULL DEFAULT '',
  `phoneNumber` varchar(100) NOT NULL DEFAULT '',
  `message` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contactus`
--

LOCK TABLES `contactus` WRITE;
/*!40000 ALTER TABLE `contactus` DISABLE KEYS */;
INSERT INTO `contactus` VALUES (1,'NName','shivan@yopmail.com','+222','9990385942','dsgfdnv','2026-10-24 07:37:44','2026-10-24 07:37:44');
/*!40000 ALTER TABLE `contactus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driverdocuments`
--

DROP TABLE IF EXISTS `driverdocuments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `driverdocuments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image` varchar(255) NOT NULL DEFAULT '',
  `driverId` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `driverId` (`driverId`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driverdocuments`
--

LOCK TABLES `driverdocuments` WRITE;
/*!40000 ALTER TABLE `driverdocuments` DISABLE KEYS */;
/*!40000 ALTER TABLE `driverdocuments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `faqs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question` varchar(255) DEFAULT NULL,
  `answer` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--

LOCK TABLES `faqs` WRITE;
/*!40000 ALTER TABLE `faqs` DISABLE KEYS */;
INSERT INTO `faqs` VALUES (1,'How do I book a ride on the app?','To book a ride, open the app, enter or confirm your pickup and drop-off locations on the map, review the estimated fare, and tap \'Book Ride\'. The nearest available driver will accept your request.','2026-10-24 07:39:48','2026-10-24 07:39:48',NULL),(2,'How is the ride fare calculated?','Fares are calculated using a base fare plus distance (per km) and duration (per minute). The app shows you an upfront fare estimate before you confirm your booking.','2026-10-24 07:39:48','2026-10-24 07:39:48',NULL),(3,'Can I cancel my ride after booking?','Yes, you can cancel your ride from the active ride screen. If you cancel shortly after booking, there is no cancellation fee. Cancellation fees may apply if the driver has already arrived near your pickup location.','2026-10-24 07:39:48','2026-10-24 07:39:48',NULL),(4,'How do I contact my driver?','Once a driver accepts your request, their contact options (call and in-app chat) become active on the ride screen so you can coordinate pickup.','2026-10-24 07:39:48','2026-10-24 07:39:48',NULL),(5,'What payment methods are accepted?','We support cash payment to the driver, digital in-app wallet, and secure online credit/debit card payments.','2026-10-24 07:39:48','2026-10-24 07:39:48',NULL),(6,'Can I track my driver in real time?','Yes, you can monitor the driver\'s live GPS movement on the interactive map along with their estimated time of arrival (ETA), vehicle model, and license plate number.','2026-10-24 07:39:49','2026-10-24 07:39:49',NULL),(7,'What should I do if I leave an item in the car?','If you leave personal belongings behind, go to \'My Rides\' / Trip History, select the relevant trip, and tap \'Report Lost Item\' or contact our support team immediately.','2026-10-24 07:39:49','2026-10-24 07:39:49',NULL),(8,'How are drivers verified for safety?','All driver partners are required to submit identity documents, driving licenses, and vehicle registrations for manual verification and approval by our admin team before accepting rides.','2026-10-24 07:39:49','2026-10-24 07:39:49',NULL),(9,'How can I update my profile details?','Tap on your profile avatar in the main menu, select \'Edit Profile\', update your name, email, or profile photo, and tap \'Save\'.','2026-10-24 07:39:49','2026-10-24 07:39:49',NULL),(10,'How do I reach customer support?','You can reach out to our support team anytime via the in-app \'Contact Us\' screen or by emailing support@radhix.com.','2026-10-24 07:39:49','2026-10-24 07:39:49',NULL);
/*!40000 ALTER TABLE `faqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL DEFAULT 0,
  `reciever_id` int(11) NOT NULL DEFAULT 0,
  `chatConstant_id` int(11) NOT NULL DEFAULT 0,
  `bookingId` int(11) NOT NULL DEFAULT 0,
  `message` varchar(255) NOT NULL DEFAULT '',
  `msgType` int(11) NOT NULL DEFAULT 0 COMMENT '1=>msg,2=>image,3=>video, 4=>call	',
  `deletedId` varchar(255) NOT NULL DEFAULT '',
  `readStatus` int(11) NOT NULL DEFAULT 0 COMMENT '1=>read,0=>Unread',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--

LOCK TABLES `message` WRITE;
/*!40000 ALTER TABLE `message` DISABLE KEYS */;
INSERT INTO `message` VALUES (1,7,3,1,4,'I\'m on my way',1,'',0,'2026-10-24 10:38:43','2026-10-24 10:38:43',NULL),(2,8,6,2,11,'I\'m coming!',1,'',1,'2026-10-28 12:17:03','2026-10-28 12:17:09',NULL),(3,6,8,2,11,'Where are you?',1,'',1,'2026-10-28 12:17:12','2026-10-28 12:17:25',NULL),(4,8,6,2,11,'I\'m at the entrance',1,'',1,'2026-10-28 12:17:15','2026-10-28 12:17:20',NULL),(5,8,6,3,12,'I\'m coming!',1,'',1,'2026-10-28 12:26:57','2026-10-28 12:26:59',NULL),(6,6,8,3,12,'I\'m stuck in traffic',1,'',1,'2026-10-28 12:27:01','2026-10-28 12:27:06',NULL);
/*!40000 ALTER TABLE `message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL DEFAULT 0,
  `receiver_id` int(11) NOT NULL DEFAULT 0,
  `message` text NOT NULL,
  `is_read` int(11) NOT NULL DEFAULT 0,
  `type` int(11) NOT NULL DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT 0,
  `bookingId` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,0,0,'You have cancelled the ride',0,3,0,2,'2026-10-24 07:28:24','2026-10-24 07:28:24',NULL),(2,0,0,'You have cancelled the ride',0,3,0,3,'2026-10-24 07:43:36','2026-10-24 07:43:36',NULL),(3,1,7,'Your account has been approved. You can now accept rides.',0,6,1,0,'2026-10-24 10:18:15','2026-10-24 10:18:15',NULL),(4,0,0,'You have cancelled the ride',0,3,0,4,'2026-10-28 11:49:11','2026-10-28 11:49:11',NULL),(5,0,0,'You have cancelled the ride',0,3,0,5,'2026-10-28 11:53:00','2026-10-28 11:53:00',NULL),(6,0,0,'You have cancelled the ride',0,3,0,6,'2026-10-28 11:55:10','2026-10-28 11:55:10',NULL),(7,0,0,'You have cancelled the ride',0,3,0,7,'2026-10-28 12:05:46','2026-10-28 12:05:46',NULL),(8,0,0,'You have cancelled the ride',0,3,0,9,'2026-10-28 12:16:23','2026-10-28 12:16:23',NULL),(9,0,0,'You have cancelled the ride',0,3,0,10,'2026-10-28 12:16:35','2026-10-28 12:16:35',NULL),(10,6,8,'Driver arrived',0,1,0,11,'2026-10-28 12:17:22','2026-10-28 12:17:22',NULL),(11,6,8,'Ride has started',0,2,0,11,'2026-10-28 12:17:29','2026-10-28 12:17:29',NULL),(12,6,8,'Ride finished successfully.',0,3,0,11,'2026-10-28 12:17:35','2026-10-28 12:17:35',NULL),(13,6,8,'Driver arrived',0,1,0,12,'2026-10-28 12:27:09','2026-10-28 12:27:09',NULL),(14,6,8,'Ride has started',0,2,0,12,'2026-10-28 12:27:15','2026-10-28 12:27:15',NULL),(15,6,8,'Ride finished successfully.',0,3,0,12,'2026-10-28 12:27:19','2026-10-28 12:27:19',NULL);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Unique payment ID',
  `user_id` int(11) NOT NULL COMMENT 'Foreign key to users table',
  `amount` double NOT NULL DEFAULT 0 COMMENT 'Payment amount',
  `date` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Date of payment',
  `status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending' COMMENT 'Payment status',
  `id_bankily` int(11) DEFAULT NULL COMMENT 'Foreign key to Bankily payment (if applicable)',
  `id_sedad` int(11) DEFAULT NULL COMMENT 'Foreign key to Sedad payment (if applicable)',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_payments_user` (`user_id`) USING BTREE,
  KEY `fk_payments_bankily` (`id_bankily`) USING BTREE,
  KEY `fk_payments_sedad` (`id_sedad`) USING BTREE,
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`id_bankily`) REFERENCES `bankily` (`operationId`),
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`id_sedad`) REFERENCES `sedad` (`id_facture`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bookingId` int(11) DEFAULT NULL,
  `reportBy` int(11) DEFAULT NULL,
  `reportTo` int(11) DEFAULT NULL,
  `rason` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bookingId` (`bookingId`),
  KEY `reportBy` (`reportBy`),
  KEY `reportTo` (`reportTo`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reportBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reports_ibfk_3` FOREIGN KEY (`reportTo`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviewrating`
--

DROP TABLE IF EXISTS `reviewrating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviewrating` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ratedBy` int(11) DEFAULT NULL,
  `ratedTo` int(11) DEFAULT NULL,
  `bookingId` int(11) DEFAULT NULL,
  `rating` varchar(255) NOT NULL DEFAULT '',
  `review` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ratedBy` (`ratedBy`),
  KEY `ratedTo` (`ratedTo`),
  KEY `bookingId` (`bookingId`),
  CONSTRAINT `reviewrating_ibfk_1` FOREIGN KEY (`ratedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reviewrating_ibfk_2` FOREIGN KEY (`ratedTo`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reviewrating_ibfk_3` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviewrating`
--

LOCK TABLES `reviewrating` WRITE;
/*!40000 ALTER TABLE `reviewrating` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviewrating` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `riderequest`
--

DROP TABLE IF EXISTS `riderequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `riderequest` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bookingId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `driverId` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '1=accept  , 2= reject',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bookingId` (`bookingId`),
  KEY `driverId` (`driverId`),
  CONSTRAINT `riderequest_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `riderequest_ibfk_2` FOREIGN KEY (`driverId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `riderequest`
--

LOCK TABLES `riderequest` WRITE;
/*!40000 ALTER TABLE `riderequest` DISABLE KEYS */;
INSERT INTO `riderequest` VALUES (2,2,3,5,6,'2026-10-24 07:28:02','2026-10-24 07:28:24',NULL),(3,3,3,5,6,'2026-10-24 07:43:26','2026-10-24 07:43:36',NULL),(4,4,3,5,6,'2026-10-24 10:37:14','2026-10-28 11:49:11',NULL),(5,4,3,7,6,'2026-10-24 10:37:14','2026-10-28 11:49:11',NULL),(6,5,3,5,6,'2026-10-28 11:51:57','2026-10-28 11:53:00',NULL),(7,6,3,5,6,'2026-10-28 11:54:56','2026-10-28 11:55:10',NULL),(8,7,8,5,6,'2026-10-28 12:05:05','2026-10-28 12:05:46',NULL),(9,8,8,5,6,'2026-10-28 12:06:07','2026-10-28 12:11:07',NULL),(10,9,8,6,6,'2026-10-28 12:16:03','2026-10-28 12:16:23',NULL),(11,10,8,6,6,'2026-10-28 12:16:30','2026-10-28 12:16:35',NULL),(12,11,8,6,1,'2026-10-28 12:16:42','2026-10-28 12:16:51',NULL),(13,12,8,6,1,'2026-10-28 12:26:33','2026-10-28 12:26:50',NULL);
/*!40000 ALTER TABLE `riderequest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sedad`
--

DROP TABLE IF EXISTS `sedad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sedad` (
  `id_facture` int(11) NOT NULL AUTO_INCREMENT,
  `payer_name` varchar(255) NOT NULL DEFAULT '',
  `payer_tel` varchar(255) NOT NULL DEFAULT '',
  `payment_code` varchar(255) NOT NULL DEFAULT '',
  `socketId` varchar(255) NOT NULL DEFAULT '',
  `num_recu` varchar(255) NOT NULL DEFAULT '',
  `id_transaction` varchar(255) NOT NULL DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id_facture`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sedad`
--

LOCK TABLES `sedad` WRITE;
/*!40000 ALTER TABLE `sedad` DISABLE KEYS */;
/*!40000 ALTER TABLE `sedad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `testinglocation`
--

DROP TABLE IF EXISTS `testinglocation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testinglocation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `pickupLocation` varchar(255) NOT NULL DEFAULT '',
  `latitude` varchar(255) NOT NULL DEFAULT '',
  `longitude` varchar(255) NOT NULL DEFAULT '',
  `dropLocation` varchar(255) NOT NULL DEFAULT '',
  `dropLatitude` varchar(255) NOT NULL DEFAULT '',
  `dropLongitude` varchar(255) NOT NULL DEFAULT '',
  `status` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `testinglocation`
--

LOCK TABLES `testinglocation` WRITE;
/*!40000 ALTER TABLE `testinglocation` DISABLE KEYS */;
/*!40000 ALTER TABLE `testinglocation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL DEFAULT 0,
  `driverId` int(11) NOT NULL DEFAULT 0,
  `bookingId` int(11) NOT NULL DEFAULT 0,
  `totalAmount` double(10,2) NOT NULL DEFAULT 0.00,
  `stripeCharge` double(10,2) NOT NULL DEFAULT 0.00,
  `trasactionid` varchar(255) NOT NULL DEFAULT '',
  `paymentStatus` enum('0','1','2') NOT NULL DEFAULT '0' COMMENT '0=>pending,1=>success,2=>failed',
  `paymentMethod` enum('0','1','2') NOT NULL DEFAULT '0' COMMENT '1=>online,2=>offline',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `driverId` (`driverId`),
  KEY `bookingId` (`bookingId`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`driverId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transferscreenshot`
--

DROP TABLE IF EXISTS `transferscreenshot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transferscreenshot` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `driverId` int(11) NOT NULL DEFAULT 0,
  `amount` double(10,2) NOT NULL DEFAULT 0.00,
  `image` varchar(255) NOT NULL DEFAULT '',
  `status` enum('0','1','2') NOT NULL DEFAULT '0' COMMENT '0=>pending,1=>approved,2=>rejected',
  `paymentStatus` enum('0','1','2') NOT NULL DEFAULT '0' COMMENT '0=>pending,1=>success,2=>failed',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `driverId` (`driverId`),
  CONSTRAINT `transferscreenshot_ibfk_1` FOREIGN KEY (`driverId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transferscreenshot`
--

LOCK TABLES `transferscreenshot` WRITE;
/*!40000 ALTER TABLE `transferscreenshot` DISABLE KEYS */;
/*!40000 ALTER TABLE `transferscreenshot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userbanks`
--

DROP TABLE IF EXISTS `userbanks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `userbanks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL DEFAULT 0,
  `accountType` enum('0','1') NOT NULL DEFAULT '1' COMMENT '0=>current, 1=>saving',
  `bankName` varchar(255) NOT NULL DEFAULT '',
  `accountCountry` varchar(255) NOT NULL DEFAULT '',
  `currency` varchar(255) NOT NULL DEFAULT '',
  `currencyCountry` varchar(255) NOT NULL DEFAULT '',
  `sortCode` varchar(50) NOT NULL DEFAULT '',
  `accountName` varchar(255) NOT NULL DEFAULT '',
  `accountNumber` varchar(255) NOT NULL DEFAULT '',
  `accountOwnerInfo` enum('0','1','2') NOT NULL DEFAULT '1' COMMENT '1=>personal,2=>company',
  `holderName` varchar(255) NOT NULL DEFAULT '',
  `city` varchar(255) NOT NULL DEFAULT '',
  `address` varchar(255) NOT NULL DEFAULT '',
  `postalCode` varchar(50) NOT NULL DEFAULT '',
  `isDefault` enum('0','1') NOT NULL DEFAULT '0' COMMENT '0=>no, 1=>yes default',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `userbanks_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userbanks`
--

LOCK TABLES `userbanks` WRITE;
/*!40000 ALTER TABLE `userbanks` DISABLE KEYS */;
/*!40000 ALTER TABLE `userbanks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role` enum('0','1','2','3') NOT NULL DEFAULT '1' COMMENT 'o=>admin,1=>user,2=>driver,3=>employee',
  `firstName` varchar(255) NOT NULL DEFAULT '',
  `lastName` varchar(255) NOT NULL DEFAULT '',
  `isProfileComplete` enum('0','1') NOT NULL DEFAULT '0',
  `email` varchar(255) NOT NULL DEFAULT '',
  `countryCode` varchar(50) NOT NULL DEFAULT '',
  `phoneNumber` varchar(100) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `image` varchar(255) NOT NULL DEFAULT '',
  `otp` varchar(255) NOT NULL DEFAULT '',
  `rideOtp` varchar(255) NOT NULL DEFAULT '',
  `otpVerify` enum('0','1') NOT NULL DEFAULT '0' COMMENT '0=>not verify,1=>verify',
  `status` enum('0','1') NOT NULL DEFAULT '1' COMMENT '0=>incative,1=>active',
  `loginTime` varchar(255) NOT NULL DEFAULT '0',
  `bio` varchar(900) NOT NULL DEFAULT '',
  `location` varchar(255) NOT NULL DEFAULT '',
  `latitude` varchar(255) NOT NULL DEFAULT '',
  `longitude` varchar(255) NOT NULL DEFAULT '',
  `isNotificationOn` enum('0','1') NOT NULL DEFAULT '1' COMMENT '0 off ,1 on',
  `deviceToken` varchar(255) DEFAULT '',
  `deviceType` varchar(255) DEFAULT '',
  `socketId` varchar(255) NOT NULL DEFAULT '',
  `online` enum('0','1') NOT NULL DEFAULT '0' COMMENT 'for chat 1=>online, 0=>offline',
  `customerId` varchar(255) NOT NULL DEFAULT '' COMMENT 'for Stripe Payment ',
  `accountId` varchar(255) NOT NULL DEFAULT '' COMMENT 'for Stripe Payment ',
  `hashAccount` enum('0','1') NOT NULL DEFAULT '0' COMMENT 'for Stripe Payment   0=>pending,1=>complete',
  `country` varchar(255) NOT NULL DEFAULT '',
  `city` varchar(255) NOT NULL DEFAULT '',
  `state` varchar(255) NOT NULL DEFAULT '',
  `gender` enum('0','1','2') NOT NULL DEFAULT '0' COMMENT 'for chat 0=>male, 1=>female, 2=>other',
  `block` enum('0','1') NOT NULL DEFAULT '0' COMMENT ' 0=>unblock, 1=>block',
  `suspend` enum('0','1') NOT NULL DEFAULT '0' COMMENT ' 0=>unsuspend, 1=>suspend',
  `approve` enum('0','1','2') NOT NULL DEFAULT '0' COMMENT ' 0=>pending, 1=>aproved, 2=>rejected',
  `documentVerify` enum('0','1','2') NOT NULL DEFAULT '0' COMMENT ' 0=>pending, 1=>verified, 2=>rejected',
  `adminCommission` varchar(255) NOT NULL DEFAULT '' COMMENT 'for admin charge',
  `totalAmount` varchar(255) NOT NULL DEFAULT '',
  `rideAmount` varchar(255) NOT NULL DEFAULT '',
  `vehicle` enum('0','1') NOT NULL DEFAULT '0',
  `lastFreeTime` datetime DEFAULT NULL,
  `languagee_type` int(11) NOT NULL DEFAULT 0,
  `priceStatus` int(11) DEFAULT 0,
  `otpStatus` int(11) DEFAULT NULL,
  `priceRushHour` varchar(255) NOT NULL DEFAULT '',
  `parkingCharge` varchar(255) NOT NULL DEFAULT '',
  `setKmRange` varchar(255) NOT NULL DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'0','Radhix','Admin','1','admin@radhix.com','','','$2b$10$S/.Anp4xQx.QngpVShrR2O2yArIyBPu480rHNc2GS5shByObQcJKK','','','','0','1','0','','','','','1','','','','0','','','0','','','','0','0','0','0','0','10','145.50','50','0',NULL,0,0,1,'70','20','50','2026-10-24 06:14:48','2026-10-28 12:27:19',NULL),(2,'1','','','0','','+91','9876543210','','','','','0','1','1792822617','','','','','1',NULL,NULL,'','0','','','0','','','','0','0','0','0','0','','','','0',NULL,0,0,NULL,'','','','2026-10-24 06:16:57','2026-10-24 06:16:57',NULL),(3,'1','','','0','','+222','9990385942','','','0','','1','1','1793188095','','','','','1','ff7IdV71SZCuTFRVwETqGW:APA91bFQ97dWuZI2fFZWjbTjFWgERNUQvLkg1bNWHkKFCpDCY3uGzsJhoUghZFe6974c-jQ_vD8VwzEElCtXze80JZ4TnUNKXX5BTKNlGRSQabZFOOsL3nA','1','','0','','','0','','','','0','0','0','0','0','','','','0',NULL,0,0,NULL,'','','','2026-10-24 06:34:49','2026-10-28 11:56:35',NULL),(4,'1','','','0','','+222','99990385942','','','','','0','1','1792823737','','','','','1','foswKvJaSni7vclORhFDMX:APA91bGBG9fQCPizsVUZhKJPkcY8r6F1IKB8YAvo1tHHtN_ZWjXFELZN7pqhTULspWnfR0JEZsER-JRIqCY6135HB49VjnrAiHH-8oe1qb4pHqnBxW38fMs','1','','0','','','0','','','','0','0','0','0','0','','','','0',NULL,0,0,NULL,'','','','2026-10-24 06:35:37','2026-10-24 06:35:38',NULL),(5,'2','Ahmed','Driver','1','','+222','9876543211','','','','','0','1','0','','','37.4219983','-122.084','1','','','','1','','','0','','','','0','0','0','1','0','','500','','1',NULL,0,0,NULL,'','','','2026-10-24 07:21:29','2026-10-24 07:21:29',NULL),(6,'2','Shivam','Kashyap','1','','+222','9990385912','','','0','9465','1','1','1793186407','','28.3889146, 77.3487973','28.3889146','77.3487973','1','eMB-JeRqSjOsRcumXdVoV8:APA91bGrGctMGuPFgiS81SABw3e9cwoVSOny2GjyXJ8TOBfRgyVEbe93YHnAj2RNtEFHFS9s6-G4LjAuwexcH6EfXNoVIc8KAkN5pQpecU2oRL2eJJwaEGY','1','','0','','','0','','','','0','0','0','1','1','','354.50','','1',NULL,0,0,NULL,'','','','2026-10-24 09:55:52','2026-11-05 08:24:04',NULL),(7,'2','Shivam','Kashyapp','1','','+222','99990385912','','','0','2205','1','1','1792836950','','Mountain View','37.4219983','-122.084','1','eQTcVkJLT4-YuwyOKohbf6:APA91bGyV7ca0WM-n8BxTNE8nN9DGH1SOqbs_TDSsSuQNxTxj1BzxU_HMWIheenR0MmHM9o8-mKvFLucxJ_HRV64i8-eycMpK782eq8hnNPgJA1-ka2MwLg','1','','1','','','0','','','','0','0','0','1','1','','','','1',NULL,0,0,NULL,'','','','2026-10-24 10:15:50','2026-10-24 10:39:22',NULL),(8,'1','','','0','','+222','882603174','','','0','','1','1','1793189073','','','','','1','c6h9u4luRg2ncON1NG-XTW:APA91bGW491vLdzqIngA9nWWGl19f7mmI6nUX3NxBH3g-UezK24LzK4PRGACOZmCPiwO0LteWpwEG27ld9FfVbjFn-YrxOgdCe_A4DaliVL1wXRtuZjLY7A','1','hfydO6W-z6CmBfGhAAAs','1','','','0','','','','0','0','0','0','0','','','','0',NULL,0,0,NULL,'','','','2026-10-28 12:04:33','2026-10-28 12:35:30',NULL),(9,'2','Shivam','kashyap','1','','+222','9990385943','','','0','9719','1','1','1793872039','','Faridabad','28.3889835','77.3487565','1','eMB-JeRqSjOsRcumXdVoV8:APA91bGrGctMGuPFgiS81SABw3e9cwoVSOny2GjyXJ8TOBfRgyVEbe93YHnAj2RNtEFHFS9s6-G4LjAuwexcH6EfXNoVIc8KAkN5pQpecU2oRL2eJJwaEGY','1','','0','','','0','','','','0','0','0','0','0','','','','1',NULL,0,0,NULL,'','','','2026-11-05 09:47:19','2026-11-05 11:12:03',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicledetails`
--

DROP TABLE IF EXISTS `vehicledetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vehicledetails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `driverId` int(11) DEFAULT NULL,
  `vehicleBrand` varchar(255) NOT NULL DEFAULT '',
  `vehicleModel` varchar(255) NOT NULL DEFAULT '',
  `vehicleYear` varchar(255) NOT NULL DEFAULT '',
  `vehicleNumber` varchar(255) NOT NULL DEFAULT '',
  `vehicleColor` varchar(255) NOT NULL DEFAULT '',
  `vehicleDocument` varchar(255) NOT NULL DEFAULT '',
  `drivingLicence` varchar(255) NOT NULL DEFAULT '',
  `insurance` varchar(255) NOT NULL DEFAULT '',
  `passengerCount` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `driverId` (`driverId`),
  CONSTRAINT `vehicledetails_ibfk_1` FOREIGN KEY (`driverId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicledetails`
--

LOCK TABLES `vehicledetails` WRITE;
/*!40000 ALTER TABLE `vehicledetails` DISABLE KEYS */;
INSERT INTO `vehicledetails` VALUES (1,5,'','','','RAD-9999','','','','',0,'2026-10-24 07:21:29','2026-10-24 07:21:29'),(2,7,'Suzuki','2016','','dl1rtc3277','','/images/83df374d-a095-4b78-825f-cc2a0ffb3c9c.jpg','/images/945bf9bb-05d4-4f24-a238-1464be2a8022.jpg','/images/9637e622-fefe-4893-bd4d-20e32d3497d9.jpg',0,'2026-10-24 10:17:26','2026-10-24 10:17:26'),(3,6,'honda','2016','','DL1RTC6246','','/images/21e29172-898a-4946-af83-dfcc0fa16d47.jpg','/images/1449411f-4f06-4676-9720-830091274b28.jpg','/images/bd8d8abc-de22-4110-ac5a-1558bb603742.jpg',0,'2026-10-28 11:20:55','2026-10-28 11:20:55'),(4,9,'tata','tata','','DL11SP6247','','/images/f575b6ab-92a2-46b1-bf7e-d7685043aefc.jpg','/images/280b868a-6987-4773-95bd-3dc0df511f85.jpg','/images/03fcab20-26b3-47da-bb98-fbc01130593b.jpg',0,'2026-11-05 09:48:08','2026-11-05 09:48:08');
/*!40000 ALTER TABLE `vehicledetails` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-06 11:15:53
