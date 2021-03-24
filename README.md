# IoTGwProxy - IoT Gateway Proxy

To channel vital sign measurements from medical devices at patient’s home to clinician at public hospitals. The project includes construction of IoT gateway, streaming platform and data visualization.

* IoT gateway: A device with Internet connectivity receiving and decoding data received from medical devices via Bluetooth, and publish the data to streaming platform 
* Streaming platform: A highly scalable platform to stream data from one end (patient’s home) to another (hospitals) asynchronously. It is a 3 nodes Kafka cluster running on AWS EC2 Linux instances.
* Visualization: Data arrived hospital Intranet is stored in Mongodb and visualize by on-premises applications in turns of graph and dashboard
