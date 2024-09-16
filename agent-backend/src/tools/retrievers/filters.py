from qdrant_client.http import models
from typing import Dict, List, Union, Optional
def create_qdrant_filters(rag_filters: Dict) -> models.Filter:

	def construct_field_condition(condition: Dict) -> models.FieldCondition:
		"""Helper function to construct individual FieldCondition based on the condition type."""
		key = condition.get('key')
		match = condition.get('match')

		# Check for 'value' (match condition)
		if 'value' in match:
			return models.FieldCondition(
				key=key,
				match=models.MatchValue(value=match['value'])
			)

		# Check for 'any' (match any condition)
		elif 'any' in match:
			return models.FieldCondition(
				key=key,
				match=models.MatchAny(any=match['any'])
			)

		# Check for 'except' (match except condition)
		elif 'except' in match:
			return models.FieldCondition(
				key=key,
				match=models.MatchExcept(**{'except': match['except']})
			)

		# Check for 'range' (range condition)
		elif 'range' in match:
			range_ = match['range']
			return models.FieldCondition(
				key=key,
				range=models.Range(
					gt=range_.get('gt'),
					gte=range_.get('gte'),
					lt=range_.get('lt'),
					lte=range_.get('lte')
				)
			)

		# Check for 'datetime_range' (datetime range condition)
		elif 'datetime_range' in match:
			datetime_range = match['datetime_range']
			return models.FieldCondition(
				key=key,
				range=models.DatetimeRange(
					gt=datetime_range.get('gt'),
					gte=datetime_range.get('gte'),
					lt=datetime_range.get('lt'),
					lte=datetime_range.get('lte')
				)
			)

		raise ValueError(f"Unsupported match type in condition: {condition}")

	# Helper to process 'must', 'should', and 'must_not'
	def process_conditions(conditions: Optional[List[Dict]]) -> List[models.FieldCondition]:
		if not conditions:
			return []
		return [construct_field_condition(cond) for cond in conditions]

	# Extract and process 'must', 'should', and 'must_not'
	must_conditions = process_conditions(rag_filters.get('must'))
	should_conditions = process_conditions(rag_filters.get('should'))
	must_not_conditions = process_conditions(rag_filters.get('must_not'))

	# Construct and return the filter
	filter_res = models.Filter(
		must=must_conditions or None,
		should=should_conditions or None,
		must_not=must_not_conditions or None
	)
	print(f"filter_res: {filter_res}")
	return filter_res

